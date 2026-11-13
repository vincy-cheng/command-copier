import assert from "node:assert/strict";
import { test } from "node:test";
import { reactive, nextTick } from "vue";
import { resolve } from "node:path";
import { loadVueComponent, mount, findAll, textContent } from "./helpers/mount-vue.mjs";

const root = resolve(import.meta.dirname, "..");
const fixtureCommands = {
  Build: [
    { command: "npm run build", description: "Compile application" },
    { command: "npm test", description: "Run checks" },
  ],
  Deploy: [{ command: "npm publish", description: "Release package" }],
};

async function loadHome({ clipboard = { writeText: async () => {} }, removeCommand, commands = fixtureCommands } = {}) {
  const store = reactive({ commands: structuredClone(commands) });
  const list = await loadVueComponent(resolve(root, "src/components/commands/ListCommands.vue"), {
    "../../store/store": { store },
    "../../utils/confirmDialog": { default: async (_type, _title, _message, action) => action?.() },
  }, { navigator: { clipboard } });
  if (removeCommand) store.removeCommand = removeCommand;
  else store.removeCommand = (group, index) => store.commands[group].splice(index, 1);
  const form = { render: () => null };
  const home = await loadVueComponent(resolve(root, "src/pages/Home.vue"), {
    "../components/commands/CreateCommandForm.vue": { default: form },
    "../components/commands/ListCommands.vue": { default: list },
    "../store/store": { store },
    "../utils/confirmDialog": { default: async (_type, _content, _title, action) => action?.() },
  });
  return { store, ...mount(home) };
}

test("search and group filters intersect case-insensitively", async () => {
  const { root: tree } = await loadHome();
  const search = findAll(tree, (node) => node.type === "input" && node.props.placeholder === "Search commands")[0];
  assert.ok(search, "search input is available");
  const groupFilter = findAll(tree, (node) => node.type === "select")[0];
  groupFilter.props.onChange({ target: { value: "Build" } });
  search.props.onInput({ target: { value: "CHECKS" } });
  await nextTick();
  assert.match(textContent(tree), /npm test/);
  assert.doesNotMatch(textContent(tree), /npm run build|npm publish/);
  search.props.onInput({ target: { value: "" } });
  await nextTick();
  assert.match(textContent(tree), /npm run build/);
  assert.doesNotMatch(textContent(tree), /npm publish/);
  search.props.onInput({ target: { value: "checks" } });
  groupFilter.props.onChange({ target: { value: "Deploy" } });
  await nextTick();
  const clear = findAll(tree, (node) => node.type === "button" && textContent(node).includes("Clear filters"))[0];
  assert.ok(clear, "no-result state offers Clear filters");
  clear.props.onClick();
  await nextTick();
  assert.match(textContent(tree), /npm publish/);
});

test("filtered row actions use original index and show resolved clipboard feedback", async () => {
  const removed = [];
  const { root: tree } = await loadHome({
    clipboard: { writeText: async (value) => assert.equal(value, "npm test") },
    removeCommand: (group, index) => removed.push([group, index]),
  });
  const search = findAll(tree, (node) => node.type === "input" && node.props.placeholder === "Search commands")[0];
  search.props.onInput({ target: { value: "checks" } });
  await nextTick();
  const copy = findAll(tree, (node) => node.type === "button" && textContent(node).trim() === "Copy")[0];
  await copy.props.onClick();
  await nextTick();
  assert.match(textContent(tree), /Copied/);
  const remove = findAll(tree, (node) => node.type === "button" && textContent(node).trim() === "Delete")[0];
  await remove.props.onClick();
  assert.deepEqual(removed, [["Build", 1]]);
});

test("clipboard rejection shows an error and failed deletion preserves the row with retry", async () => {
  const { root: tree, store } = await loadHome({
    clipboard: { writeText: async () => { throw new Error("permission denied"); } },
    removeCommand: () => { throw new Error("storage full"); },
  });
  const search = findAll(tree, (node) => node.type === "input" && node.props.placeholder === "Search commands")[0];
  search.props.onInput({ target: { value: "checks" } });
  await nextTick();
  const copy = findAll(tree, (node) => node.type === "button" && textContent(node).trim() === "Copy")[0];
  await copy.props.onClick();
  await nextTick();
  assert.match(textContent(tree), /Copy failed: permission denied/);
  const remove = findAll(tree, (node) => node.type === "button" && textContent(node).trim() === "Delete")[0];
  await remove.props.onClick();
  await nextTick();
  assert.match(textContent(tree), /Delete failed: storage full/);
  assert.equal(store.commands.Build.length, 2);
  assert.ok(findAll(tree, (node) => node.type === "button" && textContent(node).trim() === "Delete").length > 0);
});

test("empty library and empty groups offer an Add command action", async () => {
  const empty = await loadHome({ commands: {} });
  assert.match(textContent(empty.root), /No commands saved yet/);
  const grouped = await loadHome({ commands: { Empty: [] } });
  assert.match(textContent(grouped.root), /Empty \(0\)/);
  const add = findAll(grouped.root, (node) => node.type === "button" && textContent(node).trim() === "Add command")[0];
  assert.ok(add);
  add.props.onClick();
});

test("removing the selected group restores All groups", async () => {
  const { root: tree, store } = await loadHome();
  const groupFilter = findAll(tree, (node) => node.type === "select")[0];
  groupFilter.props.onChange({ target: { value: "Deploy" } });
  await nextTick();
  store.commands = { Build: fixtureCommands.Build };
  await nextTick();
  assert.equal(groupFilter.props.value, "");
  assert.match(textContent(tree), /npm run build/);
});

test("startup refresh errors are visible and existing commands remain intact", async () => {
  const store = reactive({
    commands: { Saved: [{ command: "keep", description: "Existing" }] },
    async refreshCommands() { throw new Error("storage unavailable"); },
    importCommands() {},
    exportCommands() {},
  });
  const home = { render: () => null };
  const app = await loadVueComponent(resolve(root, "src/App.vue"), {
    "./pages/Home.vue": { default: home },
    "./store/store": { store },
  });
  const { root: tree } = mount(app);
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(textContent(tree), /Could not load commands: storage unavailable/);
  assert.deepEqual(store.commands.Saved, [{ command: "keep", description: "Existing" }]);
  assert.match(textContent(tree), /Refresh.*Import.*Export/);
});

test("startup refresh and import proceed when the dialog is closed", async () => {
  let guards = 0;
  let imports = 0;
  const store = reactive({
    commands: {},
    async refreshCommands() {},
    async importCommands() { imports++; },
    exportCommands() {},
  });
  const home = {
    setup(_props, { expose }) {
      expose({ async prepareReplacement() { guards++; return true; } });
      return () => null;
    },
  };
  const appComponent = await loadVueComponent(resolve(root, "src/App.vue"), {
    "./pages/Home.vue": { default: home },
    "./store/store": { store },
  });
  const { root: tree } = mount(appComponent);
  await new Promise((resolve) => setImmediate(resolve));
  const importButton = findAll(tree, (node) => node.type === "button" && textContent(node).includes("Import"))[0];
  await importButton.props.onClick();
  assert.equal(guards, 2, "startup refresh and import both consult the guard");
  assert.equal(imports, 1, "import runs after the closed dialog is cleared");
});
