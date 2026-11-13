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
  refreshCommands: () => void;
  addCommand: (key: string, command: Command) => void;
  updateCommand: (key: string, index: number, command: Command) => void;
  removeCommand: (key: string, index: number) => void;
  removeEntireGroup: (key: string) => void;
  importCommands: () => void;
  exportCommands: () => void;
}

export const store = reactive<Store>({
  commands: {},
  async refreshCommands() {
    const storedCommands = localStorage.getItem("commands");
    if (storedCommands) {
      this.commands = JSON.parse(storedCommands) as Commands;
    }
  },
  addCommand(key: string, command: Command) {
    if (!this.commands[key]) {
      this.commands[key] = [];
    }
    this.commands[key].push(command);

    // Save the commands to local storage
    localStorage.setItem("commands", JSON.stringify(this.commands));
  },
  updateCommand(key: string, index: number, command: Command) {
    if (!this.commands[key] || !this.commands[key][index]) return;
    this.commands[key][index] = command;
    localStorage.setItem("commands", JSON.stringify(this.commands));
    this.refreshCommands();
  },
  importCommands() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.hidden = true;
    input.oncancel = () => input.remove();
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
        await sendAlert(
          "error",
          `Import failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return;
      } finally {
        input.remove();
      }
      await sendAlert("info", "Commands are imported");
    };
    // Keep the picker alive while WebKit waits for file selection.
    document.body.appendChild(input);
    input.click();
  },
  removeCommand(key: string, index: number) {
    this.commands[key].splice(index, 1);
    localStorage.setItem("commands", JSON.stringify(this.commands));
    this.refreshCommands();
  },
  removeEntireGroup(key: string) {
    delete this.commands[key];
    localStorage.setItem("commands", JSON.stringify(this.commands));
    this.refreshCommands();
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
