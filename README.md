# SUGOIDEKAI

SUGOIDEKAI is a TypeScript-based AI agent gateway inspired by OpenClaw, designed as a multi-mode terminal application with optional Telegram control and built-in OSINT workflows. It combines a local interactive CLI, agent-style tool execution, codebase analysis, and a Reddit persona crawler into a single developer-focused interface.[1]

## Preview

### Main mode selector
![Starting the tool](/images/menu.png)

The terminal UI starts with a menu-driven selector that lets users switch between CLI, Telegram, and Reddit OSINT workflows from one entry point.

### CLI mode
![CLI mode 01](/images/dekaicli1.png)
![CLI mode](/images/cli.png)

CLI mode supports local interaction through sub-modes like ASK, where prompts can trigger tool-backed responses and interactive output.

### Tool-backed ask flow
![Ask flow](/images/dekaicli2.png)

The ASK flow can invoke internal tools such as `analyze_codebase` and `list_files`, showing that the project is not only a chat shell but an agent-style execution environment.

### Reddit OSINT mode

![Reddit osint](/images/red.png)
![Reddit osint o1](/images/red2.png)

The Reddit OSINT workflow performs indexed target discovery, thread crawling, overview scanning, and persona-style intelligence gathering based on a username.

### Telegram mode

![Telegram](/images/tele.png)


Telegram mode allows the runtime to be controlled remotely through a Telegram bot while keeping the same agent-oriented workflow style.[2][1]

## Overview

This project is built around the idea of turning a local agent runtime into a usable command system across multiple interaction surfaces. The screenshots show three distinct operating modes: a local CLI mode, a Telegram-controlled mode, and a Reddit OSINT mode for persona discovery and crawler-based investigation.

Unlike a basic Telegram wrapper, SUGOIDEKAI is structured as a multi-mode agent shell. The CLI supports sub-modes such as ASK, while Telegram acts as a remote control layer, and the Reddit OSINT module provides a deeper search workflow for investigating a target username through indexed discovery and content crawling.[1]

## Features

- **Interactive terminal UI** with a menu-driven interface for selecting modes such as CLI, Telegram, and Reddit OSINT.
- **CLI sub-modes** including ASK mode for local question-answer workflows and tool-backed responses.
- **Telegram integration** for remotely interacting with the agent outside the terminal session.
- **Agent tool execution** with operations such as codebase analysis and file listing, visible in the terminal workflow.
- **Execution flow and tracking** inspired by OpenClaw's agent and tool orchestration model.[1]
- **Reddit OSINT persona generator** for deep-search and crawler-based intelligence gathering on Reddit usernames.
- **TypeScript codebase** focused on more advanced orchestration-style logic rather than a simple CRUD application.[1]

## Modes

### CLI Mode

CLI mode is the local interactive workspace where prompts are entered directly in the terminal. Based on the screenshots, this mode supports sub-mode selection and tool-driven question answering, including actions like analyzing the codebase and listing files before producing a response.

### Telegram Mode

Telegram mode allows the runtime to be controlled remotely through a Telegram bot interface. OpenClaw itself documents Telegram as one of its supported channels, which aligns with this project's remote-control layer and command-driven interaction style.[2][1]

### Reddit OSINT Mode

Reddit OSINT mode is a specialized workflow for investigating a Reddit username. The screenshots show indexed search target discovery, overview and comments processing, thread collection, and telemetry output, all of which suggest a crawler-assisted persona generation pipeline rather than a simple API call wrapper.

## Architecture

SUGOIDEKAI follows the architecture pattern commonly seen in agent gateways: an interface layer for user interaction, an orchestration layer for routing tasks, and a tool execution layer for carrying out actions. OpenClaw's public documentation describes it as an open-source gateway that connects agent workflows to channels such as Telegram, which is conceptually similar to the structure this project is following.[2][1]

From the earlier code screenshots, the project includes components such as a `ToolExecuter`, execution tracking, skills discovery, and codebase analysis logic. Those pieces indicate a modular structure where tools are isolated behind reusable interfaces, making the system easier to extend with new capabilities like OSINT modules or additional communication channels.

## Current capabilities

The screenshots indicate the following implemented capabilities:

| Capability | Evidence |
|---|---|
| Interactive mode picker | CLI menu includes CLI, Telegram, Reddit OSINT, and Exit. |
| Local ASK workflow | CLI ASK mode accepts prompts and returns answers in-terminal. |
| Remote Telegram control | Telegram mode launches a bot and waits while it runs. |
| Tool-driven analysis | ASK flow invokes tools such as `analyze_codebase` and `list_files`. |
| Reddit persona crawling | Reddit OSINT mode gathers threads, comments, and indexed targets. |

## Tech stack

Based on the project behavior and earlier discussion, the stack appears to center on TypeScript and Node.js, with a terminal interface layer, Telegram bot integration, and custom tool execution/orchestration logic. The code structure shown in the screenshots also suggests filesystem-level utilities, action tracking, and modular tool definitions rather than a monolithic script.

## Why this project matters

This project is useful as a learning and experimentation platform for agent architecture because it goes beyond ordinary web CRUD patterns. It explores command orchestration, tool execution, terminal UX, remote channel control, and OSINT-style workflows in one codebase, which makes it a good foundation for extending into more advanced developer tools or autonomous assistant systems.[1]

## Possible extensions

Some natural next steps for the project include:

- Adding more communication channels beyond Telegram, following the multi-channel gateway pattern documented by OpenClaw.[2][1]
- Expanding CLI sub-modes with planning, autonomous execution, or safer approval checkpoints.
- Storing execution logs and OSINT sessions in a database for replay and audit trails.
- Improving permission controls for remote commands issued through Telegram.
- Packaging the OSINT workflow into exportable reports or profiles.

## Disclaimer

This repository is best described as an OpenClaw-inspired project rather than a ground-up reimplementation of every underlying idea. The value of the project lies in understanding, adapting, and extending an advanced TypeScript agent-style codebase into a custom multi-mode tool with its own interface and OSINT workflows.[1]