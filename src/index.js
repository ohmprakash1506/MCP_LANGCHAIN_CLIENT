import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

import { tool } from "@langchain/core/tools";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { ChatOllama } from "@langchain/ollama";
import { pull } from "langchain/hub";
import { ConversationTokenBufferMemory } from "langchain/memory";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MCP_URL = process.env.MCP_SERVER_URL;

const addToCartTool = tool(
  async ({ userId, productId, quantity }) => {
    const response = await axios.post(MCP_URL, {
      jsonrpc: "2.0",
      method: "callTool",
      params: { name: "addToCart", arguments: { userId, productId, quantity } },
      id: Math.floor(Math.random() * 1000),
    });
    return JSON.stringify(response.data.result);
  },
  {
    name: "addToCart",
    description: "Add an item to the shopping cart",
    schema: z.object({
      userId: z.number().describe("User ID"),
      productId: z.number().describe("Product ID"),
      quantity: z.number().min(1).describe("Quantity"),
    }),
  }
);

const listProductsTool = tool(
  async () => {
    const response = await axios.post(MCP_URL, {
      jsonrpc: "2.0",
      method: "readResource",
      params: { uri: "products://all" },
      id: Math.floor(Math.random() * 1000),
    });
    return JSON.stringify(response.data.result);
  },
  {
    name: "listProducts",
    description: "List all products",
    schema: z.object({}),
  }
);

const llm = new ChatOllama({ model: "mistral" });

(async () => {
  const prompt = await pull("hwchase17/react");

  const agent = await createReactAgent({
    llm,
    tools: [addToCartTool, listProductsTool],
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools: [addToCartTool, listProductsTool],
  });

  const app = express();
  app.use(express.json());

  app.post("/prompt", async (req, res) => {
    try {
      const { prompt: userPrompt } = req.body;
      const result = await executor.invoke({ input: userPrompt });
      res.json({ response: result.output });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  const port = 3002;
  app.listen(port, () =>
    console.log(`LangChain Client running at http://127.0.0.1:${port}`)
  );
})();
