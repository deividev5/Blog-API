import { Agent } from "@mastra/core/agent";

// Agente responsável por transformar uma ideia em um post de blog completo
export const postAgent = new Agent({
  id: "post-agent",
  name: "Post Agent",
  instructions: `Você é um redator especializado em criar posts para um blog de tecnologia.
A partir da ideia enviada pelo usuário, gere um post completo, com um título curto e atrativo
e o conteúdo em formato Markdown, bem estruturado, com introdução, desenvolvimento e conclusão.`,
  model: "openai/gpt-4o",
});
