import { spinner } from "@clack/prompts";
import chalk from "chalk";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  const s = spinner({
    frames,
    delay: 80,
    styleFrame: (f) => chalk.magenta(f)
  });
  
  s.start("Processing custom loading...");
  await delay(2000);
  s.stop("Done!");
}

main();
