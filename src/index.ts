import dotenv from 'dotenv';
import express from 'express';
import { ChatOllama } from '@langchain/ollama';
import { AgentExecutor, createReactAgent } from 'langchain/agents'
import { ConversationTokenBufferMemory } from 'langchain/memory';

import axios from 'axios';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MCP_URL: any = process.env.MCP_SERVER_URL;

// Define MCP tools as LangChain tools
const addToCartTool: any = tool(
  async ({ userId, productId, quantity }) => {
    const response = await axios.post(MCP_URL, {
      jsonrpc: '2.0',
      method: 'callTool',
      params: { name: 'addToCart', arguments: { userId, productId, quantity } },
      id: Math.floor(Math.random() * 1000),
    });
    return JSON.stringify(response.data.result);
  },
  {
    name: 'addToCart',
    description: 'Add an item to the shopping cart',
    schema: z.object({
      userId: z.number().describe('User ID for the cart'),
      productId: z.number().describe('Product ID to add'),
      quantity: z.number().min(1).describe('Quantity to add'),
    }),
  }
);

const listProductsTool: any = tool(
  async () => {
    const response = await axios.post(MCP_URL, {
      jsonrpc: '2.0',
      method: 'readResource',
      params: { uri: 'products://all' },
      id: Math.floor(Math.random() * 1000),
    });
    return JSON.stringify(response.data.result);
  },
  {
    name: 'listProducts',
    description: 'List all products in the store',
    schema: z.object({}),
  }
);

const llm = new ChatOllama({ model: 'mistral' });

// Initialize memory for chat history
const memory = new ConversationTokenBufferMemory({ returnMessages: true });

// Create agent
const agent = createReactAgent({
  llm,
  tools: [addToCartTool, listProductsTool],
  memory,
});

const executor = AgentExecutor.fromAgentAndTools({
  agent,
  tools: [addToCartTool, listProductsTool],
});

// Express app for frontend to interact with LangChain
const app = express();
app.use(express.json());

app.post('/prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await executor.invoke({ input: prompt });
    res.json({ response: result.output });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

const port = 3002;

app.listen(port, () => console.log(`LangChain Client at http://127.0.0.1:${port}`));