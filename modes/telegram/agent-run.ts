import { tool, stepCountIs, ToolLoopAgent } from "ai"
import z, { unknown } from "zod"
import { getAgentModel } from "../../ai/ai.config.ts"
import { defaultAgentConfig, type AgentConfig } from "../agents/types.ts"
import { ToolExecuter } from "../agents/ToolExcuter";
import { ActionTracker } from "../agents/action_traker.ts";
import { createWebTools } from "../plan/web-tools.ts";
import { replyMd } from "./text.ts";
import { createAgentTools } from "../agents/AgentTools.ts";
import { finishOrApprove } from "./approval_session.ts";
import type { Plan, PlanStep } from "../plan/types.ts";


function readOnlyConfig(): AgentConfig {
    const c = defaultAgentConfig();
    c.tools.allowFileCreation = false;
    c.tools.allowFileModification = false;
    c.tools.allowFolderCreation = false;
    c.tools.allowShellExecution = false;

    return c;

}

function agentOptions(config: AgentConfig, maxSteps: number) {
    return {
        model: getAgentModel(),
        stopWhen: stepCountIs(maxSteps),
        instructions: `Workspace root:${config.codebasePath}`
    }
}

function createReadOnlyTools(executor: ToolExecuter) {
    return {
        read_file: tool({
            description: "Read text file from the workspace. Use a path relative to the project root.",
            inputSchema: z.object({
                path: z.string()
                    .describe("Relative file path")
            }),
            execute: async ({ path: p }) => executor.readFile(p)
        }),

        list_files: tool({
            description: "List files and directories under a path.",
            inputSchema: z.object({
                path: z.string(),
                recursive: z.boolean().optional().default(false),
            }),
            execute: async ({ path: p, recursive }) =>
                executor.listFiles(p, recursive),
        }),

        search_files: tool({
            description:
                'Find files matching a glob pattern (e.g. "*.ts", "**/*.md"). Optional content substring filter.',
            inputSchema: z.object({
                root: z.string().describe("Directory to search, relative to root"),
                pattern: z
                    .string()
                    .describe("Glob-like pattern using * and ** (forward slashes)"),
                content_contains: z.string().optional(),
            }),
            execute: async ({ root, pattern, content_contains }) =>
                executor.searchFiles(root, pattern, content_contains),
        }),

        analyze_codebase: tool({
            description:
                "Summarize structure: file counts, size, extensions. Read-only.",
            inputSchema: z.object({
                path: z.string().default("."),
            }),
            execute: async ({ path: p }) => executor.analyzeCodebase(p),
        }),

        list_skills: tool({
            description:
                "List absolute paths to SKILL.md files under configured skill directories (Cursor / Claude).",
            inputSchema: z.object({}),

            execute: async () => executor.listSkills(),
        }),

        read_skill: tool({
            description:
                "Read a SKILL.md file. Path must be absolute and under skill roots, or use a path returned by list_skills.",
            inputSchema: z.object({
                path: z.string(),
            }),
            execute: async ({ path: p }) => executor.readSkill(p),
        }),
    }

}

function extraWebTools(tracker:ActionTracker){
    return process.env.FIRECRAWL_API_KEY ? createWebTools(tracker) : {}
}

export async function runAsk(ctx:{reply:(t:string ,o?:object)=>Promise<unknown>} , question:string){

    const config =readOnlyConfig();
    const tracker = new ActionTracker();
    const executor = new ToolExecuter(tracker , config);
    const tools = {
        ...createReadOnlyTools(executor),
        ...extraWebTools(tracker)
    }

    const agent = new ToolLoopAgent({
        ...agentOptions(config,20),
        tools
    
    });

    const {text} = await agent.generate({prompt:question});
    await replyMd(ctx ,text || ("no answer"))    
}

export async function runAgent(ctx: { reply: (t: string, o?: object) => Promise<unknown> }, chatId: number, goal: string) {
  const config = defaultAgentConfig();
  const tracker = new ActionTracker();
  const executor = new ToolExecuter(tracker, config);
  const tools = createAgentTools(executor);
  const agent = new ToolLoopAgent({
    ...agentOptions(config, 40),
    tools,
  });
  const { text } = await agent.generate({ prompt: goal });
  if (text?.trim()) await replyMd(ctx, text.trim());

 await finishOrApprove(ctx, chatId, tracker, executor, '✅ Done. No file changes were needed.');
}

export async function runPlanSteps(
  ctx: { reply: (t: string, o?: object) => Promise<unknown> },
  chatId: number,
  plan: Plan,
  steps: PlanStep[],
) {
  const config = defaultAgentConfig();
  const tracker = new ActionTracker();
  const executor = new ToolExecuter(tracker, config);
  const tools = { ...createAgentTools(executor), ...extraWebTools(tracker) };

  for (const step of steps) {
    await ctx.reply(`🔧 Executing: *${step.title}*`, { parse_mode: 'Markdown' });
    const prompt = [`Goal: ${plan.goal}`, `Step: ${step.title}`, step.description].join('\n');
    const agent = new ToolLoopAgent({
      ...agentOptions(config, 30),
      tools,
    });
    const { text } = await agent.generate({ prompt });
    if (text?.trim()) await replyMd(ctx, text.trim());
  }

 await finishOrApprove(ctx, chatId, tracker, executor, '✅ All steps done. No file changes needed.');
}