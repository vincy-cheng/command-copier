import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { reactive } from "vue";

export async function loadStore({ localStorage, document, sendAlert = async () => {} }) {
  const source = await readFile(new URL("../../src/store/store.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require(name) {
      if (name === "vue") return { reactive };
      if (name === "@tauri-apps/plugin-fs") return {};
      if (name === "../utils/sendAlert") return { default: sendAlert };
      throw new Error(`Unexpected import: ${name}`);
    },
    localStorage,
    document,
    JSON,
    TextEncoder,
    Error,
    String,
  });
  return module.exports.store;
}
