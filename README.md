# Command Copier

This project is a [Tauri](https://v2.tauri.app/) application developed with Vue 3 and TypeScript in Vite. The application allows users to store, manage, and copy shell commands easily.

## Features

- **Create and edit commands**: Use a dialog to choose a group, enter a command and optional description, and save changes. Unsaved changes require confirmation before discarding.
- **Find commands**: Search group names, commands and descriptions, or filter by group. Command rows remain visible in a grouped library.
- **Copy commands**: Copy the original command text with success or failure feedback. Editing, deleting or replacing commands clears stale feedback.
- **System appearance**: Follow the system light or dark theme, with a group sidebar on desktop and a group selector in narrow windows.
- **Import and export**: Replace the collection from validated JSON or export `commands.json` to Downloads. Import blocks new editing until it completes or is cancelled; failed persistence preserves existing data.

## Prerequisites

Please ensure you have install the required dependencies according to this [doc](https://v2.tauri.app/start/prerequisites/) before start development or building.

## Local Development

Install packages

```bash
npm install
```

Run the application in development mode

```bash
npm run dev:tauri
```

Build the application

```bash
npm run build
```
Build the application in release mode

```bash
npm run build:tauri
```
