import {select , isCancel} from "@clack/prompts"
import chalk from "chalk"
import { runAgentMode } from "./agents/orchestrator";
import { runAskMode } from "./ask/orchestrator";
import { runPlanMode } from "./plan/orchestrator";
import { printLargeBanner } from "../tui/banner.ts";


export async function runCli() {
    printLargeBanner("CLI Mode", "cli");
    while(true){
        const mode =await select({
            message:"select ur CLI sub-mode",
            options:[
                {value:"agent", label:"AGENT"},
                {value:"plan", label:"PLANNING"},
                {value:"ask", label:"ASK"},
                {value:"back", label:"← BACK"},
            ]
        })
        
        if(isCancel(mode) || mode==="back" ) return;

        if(mode==="agent"){
            await runAgentMode()
        }
        if(mode==="ask"){
            await runAskMode()
        }
        if(mode==="plan"){
            await  runPlanMode()
        }

        if(mode!=='agent' && mode!=="plan" && mode!=='ask'){
            console.log(chalk.yellow("this mode is still in development"));
        }

    }

    
}
