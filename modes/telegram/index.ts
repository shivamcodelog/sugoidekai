import { Telegraf } from "telegraf";
import chalk from "chalk";
import { WELCOME } from "./constants.ts";
import { resolve } from "node:dns";
import { registerHandler } from "./handler.ts";


export async function runTelegramMode() {

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const ownerId = process.env.TELEGRAM_BOT_ID

    const bot =new Telegraf(token!)

    registerHandler(bot)

    await bot.telegram.sendMessage(ownerId! , WELCOME , {parse_mode:"Markdown"})

    bot.launch();
    console.log(chalk.green("telegram bot is running. Press ctrl+c to stop"));

    await new Promise<void>((resolve)=>{
        const stop = () =>{
            bot.stop("SIGINT");
            resolve();
        }
        process.once("SIGINT" ,stop);
        process.once("SIGTERM" ,stop);
        

    })


    
}