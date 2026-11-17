import assert from "node:assert/strict";
import { loadStore } from "./helpers/load-module.mjs";

async function runImport({ text, storageError, cancel = false }) {
  const alerts = [];
  const input = { files: text === undefined ? [{ text: async () => { throw new Error("read failed"); } }] : [{ text: async () => text }], remove() { this.removed = true; }, click() {} };
  const document = { createElement: () => input, body: { appendChild() {} } };
  const store = await loadStore({
    document,
    localStorage: { setItem(_key, value) { if (storageError) throw new Error(storageError); this.value = value; } },
    sendAlert: async (...args) => alerts.push(args),
  });
  store.commands = { old: [{ command: "keep", description: "old" }] };
  const completion = store.importCommands();
  if (cancel) input.oncancel();
  else await input.onchange();
  await completion;
  assert.equal(store.importing, false, "busy is released after every import outcome");
  return { store, input, alerts };
}

const valid = JSON.stringify({ tools: [{ command: "ls", description: "list" }] });
{
  const { store, input, alerts } = await runImport({ text: valid });
  assert.deepEqual(store.commands, { tools: [{ command: "ls", description: "list" }] });
  assert.equal(input.removed, true);
  assert.equal(alerts[0][0], "info");
}
for (const [name, options] of [
  ["invalid structure", { text: "[]" }],
  ["read failure", { text: undefined }],
  ["storage failure", { text: valid, storageError: "storage full" }],
]) {
  const { store, input, alerts } = await runImport(options);
  assert.deepEqual(store.commands, { old: [{ command: "keep", description: "old" }] }, name);
  assert.equal(input.removed, true, name);
  assert.equal(alerts[0][0], "error", name);
}
{
  const { store, input, alerts } = await runImport({ cancel: true });
  assert.deepEqual(store.commands, { old: [{ command: "keep", description: "old" }] });
  assert.equal(input.removed, true);
  assert.equal(alerts.length, 0);
}
{
  let release;
  const input = { files: [{ text: () => new Promise((resolve) => { release = () => resolve(valid); }) }], remove() {}, click() {} };
  const document = { createElement: () => input, body: { appendChild() {} } };
  const store = await loadStore({ document, localStorage: { setItem() {} } });
  const completion = store.importCommands();
  const reading = input.onchange();
  const busyWhileReading = store.importing;
  await store.importCommands();
  release();
  await reading;
  await completion;
  assert.equal(busyWhileReading, true, "import stays busy until file reading and publication finish");
  assert.equal(store.importing, false, "import releases busy after completion");
}
console.log("Import command tests passed (valid replacement, invalid structure, read/storage failure, cancel cleanup).");
