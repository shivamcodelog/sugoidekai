#!/usr/bin/env bun

// Patch DOMException.prototype.message to be writable in Bun environment
// to prevent Telegraf client from throwing TypeError when redacting tokens.
try {
  if (typeof DOMException !== "undefined" && DOMException.prototype) {
    const proto = DOMException.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "message");
    if (desc && !desc.set) {
      Object.defineProperty(proto, "message", {
        get() {
          return (this as any)._custom_message ?? desc.get?.call(this);
        },
        set(val) {
          (this as any)._custom_message = val;
        },
        configurable: true,
        enumerable: true,
      });
    }
  }
} catch (e) {
  // Ignore any patch failures
}

import { Command } from "commander";
import { runWakeup } from "./tui/wakeup";

const program = new Command()

program
   .name("dekaisugoi")
   .description("nice baddy chisa  ")
   .version("0.0.1");

program
.command("oppai")
.description("to start the cli ")
.action(async()=>{
    await runWakeup()
})

await program.parseAsync(process.argv)
