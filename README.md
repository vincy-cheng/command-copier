# Command Copier

This project is a [Tauri](https://v2.tauri.app/) application developed with Vue 3 and TypeScript in Vite. The application allows users to store, manage, and copy shell commands easily.

## Features

- **Create and edit commands**: Use a dialog to choose a group, enter a command and optional description, and save changes. Unsaved changes require confirmation before discarding.
- **Find commands**: Search group names, commands and descriptions, or filter by group. Command rows remain visible in a grouped library.
- **Copy commands**: Copy the original command text with success or failure feedback. Editing, deleting or replacing commands clears stale feedback.
- **System appearance**: Follow the system light or dark theme, with a group sidebar on desktop and a group selector in narrow windows.
- **Import and export**: Replace the collection from validated JSON or export `commands.json` to Downloads. Import blocks new editing until it completes or is cancelled; failed persistence preserves existing data.

## macOS Installation

Download the `.dmg` for your Mac from [Releases](https://github.com/vincy-cheng/command-copier/releases): `aarch64.dmg` for Apple Silicon or `x64.dmg` for Intel. Open it and drag **Command Copier** into **Applications**.

### “Command Copier” is damaged and can’t be opened

macOS may show this warning for builds that are not signed with an Apple Developer ID and notarized. If you downloaded the app from this repository’s Releases and trust the build, open Terminal and run:

```bash
xattr -dr com.apple.quarantine "/Applications/Command Copier.app"
```

Open **Command Copier** again. This command removes the downloaded-file quarantine flag from this app only; it does not verify or repair the app. If the warning persists, download a fresh copy and compare its SHA-256 checksum with the release asset’s checksum.

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

## Preview
<img width="1620" height="1144" alt="image" src="https://github.com/user-attachments/assets/519f14c1-9f43-4740-b1f0-38af68dccc09" />
