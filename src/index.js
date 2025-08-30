import { ChatOllama } from "@langchain/ollama";
import { createAgentExecutor } from "@langchain/langgraph/prebuilt";
import { getTools } from "./mcpClient/mcpClinetConfig.js";

async function main() {
    const model = new ChatOllama({
        model: "mistral"
    })

    const tools = await getTools();

    const agent = createAgentExecutor({
        model,
        tools
    })

    const userInput = "Find me a pediatrician in Hyderabad";

    const response = await agent.invoke({
    messages: [{ role: "user", content: "what's (3 + 5) x 12?" }],
    });

    console.log("Agent Response:", response);
}

main().catch(console.error);