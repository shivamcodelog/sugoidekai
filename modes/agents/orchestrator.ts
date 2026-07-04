import chalk from "chalk";
import { select, isCancel, text } from "@clack/prompts"
import { defaultAgentConfig } from "./types.ts";
import { ActionTracker } from "./action_traker.ts";
import { ToolExecuter } from "./ToolExcuter.ts";
import { createAgentTools } from "./agentTools.ts";
import { getAgentModel } from "../../ai/ai.config.ts";
import { stepCountIs, ToolLoopAgent } from "ai";
import { json } from "node:stream/consumers";

export async function runAgentMode() {

    console.log(chalk.bold("\n AGENT MODE \n "));

    const goal = await text({
        message: "What would you like the agent to do?",
        placeholder: "say anything  "

    })

    if (isCancel(goal) || !goal.trim()) return;

    const config = defaultAgentConfig()
    const tracker = new ActionTracker()
    const executer = new ToolExecuter(tracker, config)
    const tool = createAgentTools(executer)


    const agent = new ToolLoopAgent({
        model: getAgentModel(),
        stopWhen: stepCountIs(40),
        instructions: [
            `workspace root:${config.codebasePath}`,
            "All mutation are staged until approval"
        ].join("\n"),
        tools: tool,
    })


    const result = await agent.generate({
        prompt: goal.trim(),
        onStepFinish: ({ toolCalls }) => {
            for (const tc of toolCalls) {
                const preview = JSON.stringify(tc.input).slice(0, 160);

                console.log(
                    chalk.green('  ✓'),
                    chalk.bold(String(tc.toolName)),
                    chalk.dim(preview + (preview.length >= 160 ? "..." : ""))
                );
            }
        }
    })


    if(result.text.trim()) console.log( result.text);







}