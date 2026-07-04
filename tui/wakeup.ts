import {select, isCancel} from "@clack/prompts"
import chalk from "chalk"
import figlet from "figlet"
import { runCli } from "../modes/cli"
import fontData from "figlet/fonts/1Row"
import { assert } from "node:console"

const BANNER_FONT = 'ANSI Shadow'

const SHADOW = chalk.hex('#b11b69ff')
const FACE =chalk.hex('#ffbadeff').bold

function printBannerWithShadow(ascii:string){
    const bannerLines=ascii.replace(/\s+$/, '').split('\n');
    const maxLen=Math.max(...bannerLines.map((l)=>l.length),0);
    const rowwidth=maxLen+2

    for (const line of bannerLines){
        console.log(SHADOW((' '+line).padEnd(rowwidth)))
    }
    process.stdout.write(`\x1b[${bannerLines.length}A`)
    for (const line of bannerLines){
        console.log(FACE(line.padEnd(rowwidth)));
    }
    console.log()
}



export async function runWakeup(){
    let ascii:string

    try{
        ascii=figlet.textSync("dekaiOppai",{font:BANNER_FONT})
    }catch(error){
        ascii=figlet.textSync("dekaiOppai", {font:"Standard"})
    }

    printBannerWithShadow(ascii)

    const mode = await select({
        message:"Which mode u want to proceed with?",
        options:[
            {value:"cli" ,label:"CLI"},
            {value:"telegram" , label:"Telegram"},
            {value:"exit" , label:"Exit"},

        ]

    })

    if(isCancel(mode) || mode==="exit"){
        console.log(chalk.dim("exiting the program.."));
    }

    if(mode==="cli"){
       await  runCli()
    }else if(mode==="telegram"){
        console.log(chalk.dim("Starting the telegram"));
    }
}