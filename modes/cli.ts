import {select , isCancel} from "@clack/prompts"
import chalk from "chalk"


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
            console.log(chalk.dim("Agent mode"));
        }
        if(mode==="ask"){
            console.log(chalk.dim("Ask mode"));
        }
        if(mode==="plan"){
            console.log(chalk.dim("plan mode"));
        }

        if(mode!=='agent' && mode!=="plan" && mode!=='ask'){
            console.log(chalk.yellow("this mode is still in development"));
        }

    }

    
}
