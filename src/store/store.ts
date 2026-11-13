import {
  BaseDirectory,
  create,
  exists,
  writeFile,
} from "@tauri-apps/plugin-fs";

import { reactive } from "vue";
import sendAlert from "../utils/sendAlert";

// Define the type for commands
interface Command {
  description: string;
  command: string;
}

type Commands = {
  [key: string]: Command[];
};

// Define the type for the store
interface Store {
  commands: Commands;
  importing: boolean;
  refreshCommands: () => Promise<void>;
  addCommand: (key: string, command: Command) => void;
  updateCommand: (key: string, index: number, command: Command) => void;
  removeCommand: (key: string, index: number) => void;
  removeEntireGroup: (key: string) => void;
  importCommands: () => Promise<void>;
  exportCommands: () => void;
}

export const store = reactive<Store>({
  commands: {},
  importing: false,
  async refreshCommands() {
    const storedCommands = localStorage.getItem("commands");
    if (storedCommands) {
      this.commands = JSON.parse(storedCommands) as Commands;
    }
  },
  addCommand(key: string, command: Command) {
    const commands = { ...this.commands, [key]: [...(this.commands[key] ?? []), command] };
    localStorage.setItem("commands", JSON.stringify(commands));
    this.commands = commands;
  },
  updateCommand(key: string, index: number, command: Command) {
    if (!this.commands[key] || !this.commands[key][index]) return;
    const commands = { ...this.commands, [key]: [...this.commands[key]] };
    commands[key][index] = command;
    localStorage.setItem("commands", JSON.stringify(commands));
    this.commands = commands;
  },
  importCommands() {
    if (this.importing) return Promise.resolve();
    this.importing = true;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.hidden = true;
    let finish!: () => void;
    let finished = false;
    const completion = new Promise<void>((resolve) => { finish = resolve; });
    const cleanup = () => {
      if (finished) return;
      finished = true;
      input.remove();
      this.importing = false;
      finish();
    };
    input.oncancel = cleanup;
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return;
        const data = await file.text();
        const commands = JSON.parse(data);
        if (
          !commands ||
          typeof commands !== "object" ||
          Array.isArray(commands) ||
          !Object.values(commands).every(
            (group) =>
              Array.isArray(group) &&
              group.every(
                (cmd) =>
                  cmd &&
                  typeof cmd.command === "string" &&
                  typeof cmd.description === "string",
              ),
          )
        ) {
          throw new Error("Expected groups containing commands and descriptions");
        }
        localStorage.setItem("commands", JSON.stringify(commands));
        this.commands = commands;
      } catch (error) {
        try {
          await sendAlert("error", `Import failed: ${error instanceof Error ? error.message : String(error)}`);
        } catch { /* Dialog failures must not strand the import lifecycle. */ }
        return;
      } finally {
        cleanup();
      }
      try { await sendAlert("info", "Commands are imported"); } catch { /* Import is already complete. */ }
    };
    // Keep the picker alive while WebKit waits for file selection.
    try {
      document.body.appendChild(input);
      input.click();
    } catch (error) {
      cleanup();
      void sendAlert("error", `Import failed: ${error instanceof Error ? error.message : String(error)}`).catch(() => {});
    }
    return completion;
  },
  removeCommand(key: string, index: number) {
    if (!this.commands[key] || !this.commands[key][index]) return;
    const commands = { ...this.commands, [key]: [...this.commands[key]] };
    commands[key].splice(index, 1);
    localStorage.setItem("commands", JSON.stringify(commands));
    this.commands = commands;
  },
  removeEntireGroup(key: string) {
    if (!this.commands[key]) return;
    const commands = { ...this.commands };
    delete commands[key];
    localStorage.setItem("commands", JSON.stringify(commands));
    this.commands = commands;
  },
  async exportCommands() {
    const data = JSON.stringify(this.commands, null, 2);

    const file = await exists("commands.json", {
      baseDir: BaseDirectory.Download,
    });

    if (!file) {
      const newFile = await create("commands.json", {
        baseDir: BaseDirectory.Download,
      });

      newFile.write(new TextEncoder().encode(data));
      await newFile.close();
    } else {
      await writeFile("commands.json", new TextEncoder().encode(data), {
        baseDir: BaseDirectory.Download,
      });
    }

    await sendAlert("info", "Commands are exported");
  },
});
