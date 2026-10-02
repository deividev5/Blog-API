import { createApp } from "./app.js";
import { runMigrations } from "./db/index.js";

// Extraindo as variáveis de ambiente para configuração do servidor HTTP
const { API_HOST, API_PORT, API_PROTOCOL } = process.env;

// Aplica as migrations pendentes antes do servidor começar a atender requisições
await runMigrations();

const server = createApp();

// Iniciando o servidor na porta definida nas variáveis de ambiente
server.listen(API_PORT, () => {
  console.log(`Server running on ${API_PROTOCOL}://${API_HOST}:${API_PORT}`);
  console.log("Press Ctrl+C to stop the server");
});
