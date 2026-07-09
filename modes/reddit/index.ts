import { text, isCancel, confirm } from "@clack/prompts";
import chalk from "chalk";
import Firecrawl from "@mendable/firecrawl-js";
import { generateText } from "ai";
import { getAgentModel } from "../../ai/ai.config.ts";
import { createSpinner } from "../../tui/spinner.ts";
import { renderTerminalMarkdown } from "../../tui/terminal-md.ts";
import { printLargeBanner } from "../../tui/banner.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";

// Helper function to fetch old Reddit page directly to bypass Firecrawl restrictions
async function fetchOldRedditPage(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OSINT-tool/1.0"
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return response.text();
}

// Helper function to extract "next" page URL from old.reddit HTML content
function findNextPageUrl(html: string): string | null {
    const regex = /href="([^"]+\?count=\d+&(?:amp;)?after=[a-zA-Z0-9_]+)"[^>]*rel="[^"]*next/i;
    const match = html.match(regex);
    if (match && match[1]) {
        let url = match[1].trim();
        url = url.replace(/&amp;/g, "&");
        if (url.startsWith("/")) {
            return `https://old.reddit.com${url}`;
        }
        return url;
    }
    
    // Fallback match for any link containing after= query parameter
    const fallbackRegex = /href="([^"]+\?count=\d+&(?:amp;)?after=[a-zA-Z0-9_]+)"/i;
    const fallbackMatch = html.match(fallbackRegex);
    if (fallbackMatch && fallbackMatch[1]) {
        let url = fallbackMatch[1].trim();
        url = url.replace(/&amp;/g, "&");
        if (url.startsWith("/")) {
            return `https://old.reddit.com${url}`;
        }
        return url;
    }
    return null;
}

// Helper function to convert any reddit URL to old.reddit.com for cleaner scraping
function makeOldRedditUrl(url: string): string {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === "reddit.com" || parsed.hostname === "www.reddit.com") {
            parsed.hostname = "old.reddit.com";
        }
        return parsed.toString();
    } catch {
        return url;
    }
}

// Helper function to parse old.reddit HTML content to structured Markdown format
function parseRedditHtmlToMarkdown(html: string): string {
    const parts = html.split(/<div[^>]+class="[^"]*thing[^"]*"/g);
    const entries: string[] = [];
    
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        
        const subMatch = part.match(/<a[^>]+class="[^"]*subreddit[^"]*"[^>]*>([a-zA-Z0-9_]+)<\/a>/i)
                      || part.match(/href="\/r\/([a-zA-Z0-9_]+)\/"/i);
        const subreddit = (subMatch && subMatch[1]) ? `r/${subMatch[1]}` : "unknown";
        
        const titleMatch = part.match(/<a[^>]+class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        const title = (titleMatch && titleMatch[1]) ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        
        const mdBodyMatch = part.match(/<div[^>]+class="[^"]*usertext-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
                         || part.match(/<div[^>]+class="[^"]*md[^>]*>([\s\S]*?)<\/div>/i);
        let body = "";
        if (mdBodyMatch && mdBodyMatch[1]) {
            body = mdBodyMatch[1]
                .replace(/<p>/gi, "\n")
                .replace(/<\/p>/gi, "\n")
                .replace(/<[^>]+>/g, " ")
                .trim();
        }
        
        const taglineMatch = part.match(/<p[^>]+class="[^"]*tagline[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        let tagline = (taglineMatch && taglineMatch[1]) ? taglineMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        tagline = tagline.replace(/\s+/g, " ");

        const cleanText = (txt: string) => {
            return txt
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        };

        const cleanTitle = cleanText(title);
        const cleanBody = cleanText(body);
        
        if (cleanTitle || cleanBody) {
            let entryMd = `#### Subreddit: ${subreddit}\n`;
            if (tagline) entryMd += `*Tagline: ${cleanText(tagline)}*\n`;
            if (cleanTitle) entryMd += `* **Title**: ${cleanTitle}\n`;
            if (cleanBody) entryMd += `* **Body/Comment**: ${cleanBody}\n`;
            entries.push(entryMd);
        }
    }
    
    return entries.length > 0 ? entries.join("\n---\n\n") : "No posts or comments found on this page.";
}

export async function runRedditMode() {
    printLargeBanner("reddit osint", "reddit");
    console.log(chalk.bold("\nReddit OSINT Persona Generator (Deep Search & Crawler Mode)\n"));

    const username = await text({
        message: "Enter the Reddit username to investigate (e.g. spez):",
        placeholder: "spez",
        validate: (v) => {
            const trimmed = (v ?? "").trim();
            if (!trimmed) return "Username is required";
            if (trimmed.includes(" ")) return "Reddit usernames cannot contain spaces";
        }
    });

    if (isCancel(username) || !username.trim()) {
        console.log(chalk.dim("Returning to main menu..."));
        return;
    }

    const targetUsername = username.trim();

    // Verify FIRECRAWL_API_KEY is available
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
        console.log(chalk.red("\n[-] Error: FIRECRAWL_API_KEY environment variable is not set."));
        console.log(chalk.yellow("Please set FIRECRAWL_API_KEY in your environment to perform searches.\n"));
        return;
    }

    const firecrawl = new Firecrawl({ apiKey: firecrawlApiKey });
    
    // 1. Google Dorking Search (Targeting Reddit and mentions)
    const dorkQuery = `site:reddit.com "u/${targetUsername}" OR site:reddit.com/user/${targetUsername}`;
    const searchSpinner = createSpinner();
    searchSpinner.start(`[1/3] Querying Google index for dorks matching "u/${targetUsername}" (limit: 20)`);

    let searchResults;
    try {
        searchResults = await firecrawl.search(dorkQuery, {
            limit: 20,
            sources: ["web"]
        });
    } catch (err: any) {
        searchSpinner.stop("Search failed!");
        console.log(chalk.red(`[-] Google Search failed: ${err.message || err}`));
    }

    const webResults = searchResults?.web || [];
    searchSpinner.stop(`Found ${webResults.length} indexed search targets.`);

    const scrapedData: Array<{ source: string; url: string; content: string }> = [];

    // All combined text to discover subreddits
    let allDiscoveredText = webResults.map((r: any) => `${r.title} ${r.url} ${r.snippet}`).join(" ");

    // 2. Direct overview scraping (with HTML pagination up to 3 pages)
    let nextOverviewUrl: string | null = `https://old.reddit.com/user/${targetUsername}/`;
    let overviewPage = 1;
    const maxOverviewPages = 3;

    while (nextOverviewUrl && overviewPage <= maxOverviewPages) {
        const pageSpinner = createSpinner();
        pageSpinner.start(`[2/4] Fetching profile overview page ${overviewPage} for "u/${targetUsername}"`);
        
        try {
            const currentUrl = nextOverviewUrl;
            const html = await fetchOldRedditPage(currentUrl);
            const md = parseRedditHtmlToMarkdown(html);
            
            scrapedData.push({
                source: `Profile Overview Page ${overviewPage}`,
                url: currentUrl,
                content: md
            });
            allDiscoveredText += " " + md;
            
            // Look for pagination in raw HTML
            nextOverviewUrl = findNextPageUrl(html);
            pageSpinner.stop(`Completed overview page ${overviewPage}.` + (nextOverviewUrl ? " Next page found." : " No more pages."));
            overviewPage++;
        } catch (err: any) {
            pageSpinner.stop("Fetch failed.");
            console.log(chalk.dim(`    Skipping overview page ${overviewPage} due to fetching issue: ${err.message || err}`));
            break;
        }
    }

    // 3. Direct comments scraping (with HTML pagination up to 2 pages)
    let nextCommentsUrl: string | null = `https://old.reddit.com/user/${targetUsername}/comments/`;
    let commentsPage = 1;
    const maxCommentsPages = 2;

    while (nextCommentsUrl && commentsPage <= maxCommentsPages) {
        const pageSpinner = createSpinner();
        pageSpinner.start(`[3/4] Fetching comments page ${commentsPage} for "u/${targetUsername}"`);
        
        try {
            const currentUrl = nextCommentsUrl;
            const html = await fetchOldRedditPage(currentUrl);
            const md = parseRedditHtmlToMarkdown(html);
            
            scrapedData.push({
                source: `Comments Page ${commentsPage}`,
                url: currentUrl,
                content: md
            });
            allDiscoveredText += " " + md;
            
            // Look for pagination in raw HTML
            nextCommentsUrl = findNextPageUrl(html);
            pageSpinner.stop(`Completed comments page ${commentsPage}.` + (nextCommentsUrl ? " Next page found." : " No more pages."));
            commentsPage++;
        } catch (err: any) {
            pageSpinner.stop("Fetch failed.");
            console.log(chalk.dim(`    Skipping comment page ${commentsPage} due to fetching issue: ${err.message || err}`));
            break;
        }
    }

    // 4. Scrape the actual thread URLs found in the Google search, using old.reddit and local fetching
    const searchUrlsToScrape = Array.from(new Set(
        webResults
            .map((item: any) => item.url)
            .filter((url: string) => url && (url.includes("reddit.com/r/") || url.includes("reddit.com/user/")))
    ))
    .map(url => makeOldRedditUrl(url))
    .slice(0, 5); // Limit to top 5 most relevant threads to avoid excessive rate limits

    let threadIndex = 1;
    for (const url of searchUrlsToScrape) {
        const pageSpinner = createSpinner();
        pageSpinner.start(`[4/4] Fetching Google search thread ${threadIndex}/${searchUrlsToScrape.length}: ${url}`);
        try {
            const html = await fetchOldRedditPage(url);
            const md = parseRedditHtmlToMarkdown(html);
            
            scrapedData.push({
                source: `Google Dork Thread ${threadIndex}`,
                url: url,
                content: md
            });
            allDiscoveredText += " " + md;
            pageSpinner.stop(`Completed thread ${threadIndex}.`);
        } catch (err: any) {
            pageSpinner.stop("Fetch failed.");
            console.log(chalk.dim(`    Skipping thread due to fetching issue: ${err.message || err}`));
        }
        threadIndex++;
    }

    // Extract subreddits matching `/r/SubredditName`
    const subreddits = new Set<string>();
    const subMatch = /\/r\/([a-zA-Z0-9_]{3,21})/gi;
    let match;
    while ((match = subMatch.exec(allDiscoveredText)) !== null) {
        if (match[1]) {
            subreddits.add(match[1].toLowerCase());
        }
    }

    // Output live OSINT telemetry summary
    console.log(chalk.cyan("\n--- OSINT Discovery Telemetry ---"));
    if (subreddits.size > 0) {
        const formattedSubs = Array.from(subreddits).map(s => `r/${s}`).join(", ");
        console.log(chalk.green(`[+] Identified active subreddits: ${formattedSubs}`));
    } else {
        console.log(chalk.yellow(`[-] No subreddit references identified in crawled text.`));
    }
    console.log(chalk.cyan(`[+] Gathered ${scrapedData.length} total source content pages with Google index data.`));
    console.log(chalk.cyan("---------------------------------\n"));

    // Prepare LLM analysis
    const modelSpinner = createSpinner();
    modelSpinner.start(`Generating  intelligence profile for "u/${targetUsername}"...`);

    const snippetsMarkdown = webResults.map((item: any, idx: number) => {
        return `### Google Dork Result #${idx + 1}: ${item.title}\nURL: ${item.url}\nSnippet: ${item.snippet}`;
    }).join("\n\n");

    const pagesMarkdown = scrapedData.map((data, idx) => {
        // Keep up to 6000 chars per crawled page to prevent model overflow while preserving all core content
        return `### Crawled Source #${idx + 1} (${data.source})\nURL: ${data.url}\nContent:\n${data.content.slice(0, 6000)}`;
    }).join("\n\n");

    const prompt = `
You are an advanced Intelligence and OSINT (Open Source Intelligence) analyzer.
You are tasked with building a highly detailed, perfect details persona profile of the Reddit user "u/${targetUsername}" using the gathered Google Dorking search results and crawled Reddit pages content.

Gathered Metadata & Google Snippets:
${snippetsMarkdown}

Gathered Scraped Page Contents:
${pagesMarkdown}

Please generate an extremely detailed, structured, and easy-to-read Perplexity-style OSINT Intelligence report on this user.
Ensure you strictly adhere to the following rules:

### Intelligence Processing Rules:
1. **Preserve All Details**: Do not miss any post, title, subreddit, timestamp, or source clue from the provided data. Extract and preserve every relevant detail from each result, even if it seems minor or trivial.
2. **Connect the Dots**: Cross-reference and link evidence across posts. Infer recurring themes, patterns in intent, geographical locations, skills, lifestyle, goals, timeline, writing tone, and behavior. Treat the data holistically rather than in isolation.
3. **Data Integrity & Traceability**: Never omit a result from the source data set. Never collapse multiple posts into one unless you still preserve each post's unique contribution and keep source traceability.
4. **Facts vs. Inference**: Draw a clear boundary between established facts (directly stated in the data) and inferences (deduced or hypothesized). 
5. **Confidence Levels**: Assign specific confidence levels (e.g., HIGH, MEDIUM, LOW) along with justifications for all major claims or profiling assertions.
6. **Metadata Inference**: If full content is missing for a search result, state it explicitly and infer cautiously from the available metadata, title, and snippets.
7. **Readability & Formatting**: Avoid walls of text. Use clear subheadings, bullet points, numbered lists, short paragraphs, and compact markdown tables where they enhance readability.

The report MUST use the following exact structure:

# OSINT Intelligence Report: u/${targetUsername}

## 1. Executive Summary
- Brief high-level summary of who this target is, their domain of presence, and primary findings.

## 2. TL;DR Persona
- A concise, high-impact TL;DR persona summary of the user in exactly 3 to 5 lines.

## 3. Identity / Profile
- Known identifiers, usernames/handles, affiliated platforms, domains of interest.
- Formulate a table or clear list of key personal metadata (e.g., location, occupation, gender, subreddits frequented, estimated age) with confidence scores.

## 4. Post-by-Post Evidence & Evidence Map
- A comprehensive "evidence map" listing EVERY SINGLE result/post from the input.
- For each post, list:
  * Title & URL
  * Subreddit / Source details
  * Specific facts extracted
  * Minor details (timestamps, style cues, tools mentioned, etc.)
  * What this source contributes to the overall profile

## 5. Pattern Analysis ("What This Suggests")
- Theme synthesis connecting the dots across different posts.
- Recurring topics of discussion, software/hardware tools used, professional skills, user goals, and behavioral motives.
- Synthesize all findings into a coherent mental model of the persona.

## 6. Timeline / Behavioral Trends
- Analysis of user activity over time, posting frequency, shifts in tone (e.g., technical, conversational, frustrated, helpful), and key milestones mentioned in posts.

## 7. Risks / Privacy Exposure
- Assessment of the user's doxxing risk (Scale 1-10) and specific leaks (e.g., location, email style, API keys, names).
- Actionable recommendations and mitigations the user should take to secure their privacy.

## 8. Confidence and Gaps (Uncertainty Analysis)
- Explicit details on where the source data is weak or where information gaps exist.
- Clarify where you have low confidence to prevent overclaiming.

## 9. Final Persona Summary
- A final closing character summary of the target, detailing their persona archetype and closing remarks.

Write in a clean, objective, professional, and analytical tone. Begin the report immediately.
`;

    let result;
    try {
        result = await generateText({
            model: getAgentModel(),
            prompt: prompt
        });
    } catch (err: any) {
        modelSpinner.stop("Analysis failed!");
        console.log(chalk.red(`\n[-] Persona generation failed: ${err.message || err}\n`));
        return;
    }

    modelSpinner.stop("Report generated successfully!");

    const answer = result.text || "(No report text returned)";

    console.log("\n" + renderTerminalMarkdown(answer) + "\n");

    // Ask to save report
    const wantsSave = await confirm({
        message: "Save this OSINT persona report to a .md file in the current directory?",
        initialValue: false,
    });

    if (isCancel(wantsSave) || !wantsSave) {
        console.log(chalk.dim("Returning to main menu..."));
        return;
    }

    const defaultFilename = `reddit_osint_${targetUsername}.md`;
    const fileName = await text({
        message: "Enter filename:",
        initialValue: defaultFilename,
        validate: (v) => {
            const s = (v ?? '').trim();
            if (!s) return 'Required';
            if (s.includes('..') || s.includes('/') || s.includes('\\')) return 'No directory paths allowed';
            if (!s.toLowerCase().endsWith('.md')) return "Must end with .md";
        }
    });

    if (isCancel(fileName) || !fileName.trim()) {
        console.log(chalk.dim("File save cancelled. Returning to main menu..."));
        return;
    }

    try {
        await fs.writeFile(path.resolve(process.cwd(), fileName.trim()), answer, "utf-8");
        console.log(chalk.green(`✓ Saved successfully to ${fileName.trim()}`));
    } catch (err: any) {
        console.log(chalk.red(`[-] Failed to save file: ${err.message || err}`));
    }

    console.log(chalk.dim("\nFinished. Returning to menu..."));
}
