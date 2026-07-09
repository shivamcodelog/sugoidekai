import { Telegraf } from "telegraf";
import chalk from "chalk";
import { WELCOME } from "./constants.ts";
import { resolve } from "node:dns";
import { registerHandler } from "./handler.ts";
import { printLargeBanner } from "../../tui/banner.ts";


export async function runTelegramMode() {
    printLargeBanner("telegram", "telegram");
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const ownerId = process.env.TELEGRAM_BOT_ID

    const bot =new Telegraf(token!)

    registerHandler(bot)

    await bot.telegram.sendMessage(ownerId! , WELCOME , {parse_mode:"Markdown"})

    bot.launch();
    console.log(chalk.green("telegram bot is running. Press Enter to stop and return to menu..."));

    await new Promise<void>((resolve)=>{
        const stop = () =>{
            bot.stop("SIGINT");
            resolve();
        }

        const onStdinData = () => {
            cleanup();
            stop();
        };

        const onSigInt = () => {
            cleanup();
            stop();
        };

        const cleanup = () => {
            process.stdin.off("data", onStdinData);
            process.stdin.pause();
            process.off("SIGINT", onSigInt);
            process.off("SIGTERM", onSigInt);
        };

        process.stdin.resume();
        process.stdin.once("data", onStdinData);
        process.once("SIGINT" ,onSigInt);
        process.once("SIGTERM" ,onSigInt);
    })


    
}