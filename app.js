const express = require("express"); // Importa o framework Express.
const { z } = require("zod"); // Importa a biblioteca Zod para validação de dados.
const { Contato } = require('./models'); // Importa o modelo Contato.
const fs = require("fs"); // Importa o módulo fs para manipulação de arquivos.
const path = require("path"); // Importa o módulo path para manipulação de caminhos de arquivos.

const app = express(); 

// Middleware para registrar acessos
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.originalUrl}\n`; // Cria a linha de log
    fs.appendFile(path.join(__dirname, 'access.log'), log, (err) => { // Adiciona a linha ao arquivo access.log
        if (err) {
            console.error("Erro ao escrever no arquivo de log:", err); // Se houver erro, exibe no console
        }
    });
    next(); // Chama o próximo middleware/rota
});

// Define um esquema de validação para o contato usando Zod.
const contatoSchema = z.object({
    nome: z.string({ message: "Campo nome é obrigatório" }) // Define o campo nome como obrigatório e um string.
        .min(3, { message: "O nome deve ter no mínimo 03 caracteres." }), // Adiciona uma validação mínima de 3 caracteres.

    email: z.string({ message: "Campo e-mail é obrigatório." }) // Define o campo e-mail como obrigatório e um string.
        .email({ message: "Deve ser um e-mail válido." }), // Adiciona validação para verificar se é um e-mail válido.

    telefone: z.string() // Define o campo telefone como obrigatório e um string.
        .regex(/^\(\d{2}\) \d{5}-\d{4}$/, { message: "Deve enviar um telefone válido" }) // Adiciona uma validação usando expressão regular para um formato específico.
});

// Define o motor de visualização como EJS (Embedded JavaScript).
app.set("view engine", "ejs");
// Define o diretório onde as views (páginas) estão localizadas.
app.set("views", "./views");
// Configura o middleware para interpretar dados de formulários URL-encoded (como o `application/x-www-form-urlencoded`).
app.use(express.urlencoded({ extended: true }));
// Configura o middleware para interpretar dados JSON nas requisições.
app.use(express.json());

// Rota GET para a raiz do site ("/").
app.get("/", (req, res) => {
    res.render("index"); // Renderiza a página "index.ejs".
});

// Rota POST para a raiz do site ("/"), que é chamada quando o formulário é enviado.
app.post("/", async (req, res) => {
    const contato = req.body; // Captura os dados do formulário.

    // Valida os dados do contato usando o esquema definido anteriormente.
    const resultado = contatoSchema.safeParse(contato);

    if (!resultado.success) { // Se a validação falhar...
        const erros = resultado.error.issues.map(issue => issue.message); // Extrai as mensagens de erro.
        res.status(400).send(erros.join("; ")); // Retorna um status 400 e as mensagens de erro.
    } else {
        // Se a validação for bem-sucedida, cria um novo contato no banco de dados.
        await Contato.create({ nome: contato.nome, telefone: contato.telefone, email: contato.email });
        res.send("Contato salvo com sucesso"); // Retorna uma mensagem de sucesso.
    }
});

// Nova rota GET para exibir todos os contatos cadastrados
app.get("/contatos", async (req, res) => {
    try {
        const contatos = await Contato.findAll(); // Busca todos os contatos do banco de dados
        res.render("contatos", { contatos }); // Renderiza a página "contatos.ejs" passando a lista de contatos
    } catch (error) {
        console.error("Erro ao buscar contatos:", error); // Exibe erro no console
        res.status(500).send("Erro ao buscar contatos."); // Retorna um erro genérico
    }
});

// Inicia o servidor na porta 3000 e exibe uma mensagem no console quando ele estiver rodando.
app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
