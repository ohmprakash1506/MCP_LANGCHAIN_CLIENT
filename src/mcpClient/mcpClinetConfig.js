import { MultiServerMCPClient } from "@langchain/mcp-adapters";

import ENV from "../utils/ENV.js";

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    default: {
      transport: "http",
      url: ENV.MCP_SERVER_URL,
    },
  },
});

export async function getTools() {
  return await mcpClient.getTools();
}