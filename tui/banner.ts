import chalk from "chalk";
import figlet from "figlet";

const BANNER_FONT = "ANSI Shadow";

export interface BannerColorScheme {
    face: string;
    shadow: string;
}

export const BANNER_THEMES = {
    default: {
        face: "#01ac7eff",   
        // face: "#d71f7eff",   
        shadow: "#b11b69ff", 
    },
    cli: {
        face: "#ff9d00ff",     
        shadow: "#5e17eb",   
    },
    telegram: {
        face: "#00f5d4",     
        shadow: "#1d3557",   
    },
    reddit: {
        face: "#ff4500", // Reddit Orange-Red
        shadow: "#5f1f00",
    }
} as const;

export function printBannerWithShadow(ascii: string, faceColor: string, shadowColor: string) {

    console.log('\n');

    const bannerLines = ascii.replace(/\s+$/, "").split("\n");
    const maxLen = Math.max(...bannerLines.map((l) => l.length), 0);
    const rowwidth = maxLen + 2;

    const SHADOW = chalk.hex(shadowColor);
    const FACE = chalk.hex(faceColor);

    for (const line of bannerLines) {
        console.log(SHADOW((" " + line).padEnd(rowwidth)));
    }
    process.stdout.write(`\x1b[${bannerLines.length}A`);
    for (const line of bannerLines) {
        console.log(FACE(line.padEnd(rowwidth)));
    }
    console.log();
}

export function printLargeBanner(text: string, themeName: "default" | "cli" | "telegram" | "reddit" = "default") {
    const theme = BANNER_THEMES[themeName] || BANNER_THEMES.default;
    let ascii: string;
    try {
        ascii = figlet.textSync(text, { font: BANNER_FONT });
    } catch (error) {
        ascii = figlet.textSync(text, { font: "Standard" });
    }
    printBannerWithShadow(ascii, theme.face, theme.shadow);
}
