import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function getAgentMode() {
    const provider = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })

    const modelId:any = process.env.OPENROUTER_DEFAULT_MODEL;

    return provider(modelId);

}