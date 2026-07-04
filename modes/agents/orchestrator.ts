import chalk from "chalk";
import {select, isCancel ,text} from "@clack/prompts"
import { defaultAgentConfig } from "./types.ts";
import { ActionTracker } from "./action_traker.ts";
import { ToolExecuter } from "./ToolExcuter.ts";

export async function runAgentMode() {

    console.log(chalk.bold("\n AGENT MODE \n "));

    const goal=await text({        
        message:"What would you like the agent to do?",
        placeholder:"say anything  "

    })

    if(isCancel(goal) || !goal.trim()) return;

    const config = defaultAgentConfig()
    const tracker = new ActionTracker()
    const executer = new ToolExecuter(tracker,config)
    
}