#!/usr/bin/env bun

import { Command } from "commander";
import { runWakeup } from "./tui/wakeup";

const program = new Command()

program
   .name("dekaioppai")
   .description("dekaioppai cli tool for fun code ")
   .version("0.0.1");

program
.command("sugoi")
.description("start the cli with dekai banner")
.action(async()=>{
    await runWakeup()
})

await program.parseAsync(process.argv)
