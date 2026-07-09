import { select, isCancel } from "@clack/prompts";
import chalk from "chalk";
import { runCli } from "../modes/cli";
import { runTelegramMode } from "../modes/telegram";
import { printLargeBanner } from "./banner";

export async function runWakeup() {
    printLargeBanner("dekaisugoi");

    while (true) {
        const mode = await select({
            message: "ready when you are, pick a mode & lets larp",
            options: [
                { value: "cli", label: "CLI" },
                { value: "telegram", label: "Telegram" },
                { value: "exit", label: "Exit" },
            ]
        });

        if (isCancel(mode) || mode === "exit") {
            console.log(chalk.dim("exiting the program..."));
            return;
        }

        if (mode === "cli") {
            await runCli();
        } else if (mode === "telegram") {
            await runTelegramMode();
        }
    }
}