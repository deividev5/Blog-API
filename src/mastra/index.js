import { Mastra } from "@mastra/core";
import { postAgent } from "./agents/post-agent.js";

export const mastra = new Mastra({
  agents: { postAgent },
});
