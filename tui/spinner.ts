import { spinner as clackSpinner } from "@clack/prompts";
import chalk from "chalk";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_COLOR = chalk.hex("#ffbadeff"); // Sleek theme-matched color

export function createSpinner() {
  return clackSpinner({
    frames: FRAMES,
    delay: 80,
    styleFrame: (frame) => SPINNER_COLOR(frame)
  });
}
