import assert from "node:assert/strict";
import test from "node:test";
import { loadStore } from "./helpers/load-module.mjs";

test("addCommand preserves reactive commands when persistence fails", async () => {
  const store = await loadStore({
    localStorage: { setItem() { throw new Error("storage full"); } },
  });
  store.commands = { tools: [{ command: "old", description: "existing" }] };

  assert.throws(() => store.addCommand("tools", { command: "new", description: "new" }), /storage full/);
  assert.deepEqual(store.commands, { tools: [{ command: "old", description: "existing" }] });
});

for (const [name, mutate] of [
  ["updateCommand", (store) => store.updateCommand("tools", 0, { command: "new", description: "new" })],
  ["removeCommand", (store) => store.removeCommand("tools", 0)],
  ["removeEntireGroup", (store) => store.removeEntireGroup("tools")],
]) {
  test(`${name} preserves reactive commands when persistence fails`, async () => {
    const store = await loadStore({ localStorage: { setItem() { throw new Error("storage full"); } } });
    store.commands = { tools: [{ command: "old", description: "existing" }] };
    assert.throws(() => mutate(store), /storage full/);
    assert.deepEqual(store.commands, { tools: [{ command: "old", description: "existing" }] });
  });
}
