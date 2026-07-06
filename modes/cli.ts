import {select , isCancel} from "@clack/prompts"
import chalk from "chalk"
import { runAgentMode } from "./agents/orchestrator";
import { runAskMode } from "./ask/orchestrator";


export async function runCli() {
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
            console.log(chalk.dim("plan mode"));
        }

        if(mode!=='agent' && mode!=="plan" && mode!=='ask'){
            console.log(chalk.yellow("this mode is still in development"));
        }

    }

    
}
