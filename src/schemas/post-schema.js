import { z } from "zod";

// Schema do post gerado pelo agente de IA
export const postSchema = z.object({
  titulo: z.string(),
  content: z.string(),
});
