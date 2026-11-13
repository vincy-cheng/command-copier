import assert from "node:assert/strict";
import { test } from "node:test";
import { reactive, nextTick } from "vue";
import { resolve } from "node:path";
import { findAll, loadVueComponent, mount, textContent } from "./helpers/mount-vue.mjs";

const path = resolve(import.meta.dirname, "../src/components/commands/CreateCommandForm.vue");
async function form({ commands = {}, fail = false, editing = null } = {}) {
  const store = reactive({ commands, addCommand(group, item) { if (fail) throw new Error("storage full"); this.commands[group] = [...(this.commands[group] ?? []), item]; }, updateCommand(group, index, item) { this.commands[group][index] = item; } });
  const component = await loadVueComponent(path, { "../../store/store": { store } });
  const mounted = mount(component, { editing, opened: true, initialGroup: "" });
  return { store, ...mounted };
}
function input(node, value) { node.props.onInput({ target: { value } }); }
function fields(tree) {
  const nodes = findAll(tree, (node) => node.type === "input" || node.type === "textarea" || node.type === "select");
  return { groupChoice: nodes.find((n) => n.type === "select"), groupName: nodes.find((n) => n.type === "input" && n.props.placeholder === "New group name"), command: nodes.find((n) => n.type === "textarea" && n.props.id === "command"), description: nodes.find((n) => n.type === "textarea" && n.props.id === "description") };
}

test("new commands trim group names but preserve command whitespace and allow blank descriptions", async () => {
  const { root, store } = await form();
  const f = fields(root);
  input(f.groupName, "  Tools  ");
  input(f.command, "  echo hi\nnext  ");
  input(f.description, "");
  findAll(root, (node) => node.type === "form")[0].props.onSubmit({ preventDefault() {} });
  assert.deepEqual(JSON.parse(JSON.stringify(store.commands)), { Tools: [{ command: "  echo hi\nnext  ", description: "" }] });
});

test("a saved group named new remains selectable", async () => {
  const { root, store } = await form({ commands: { new: [] } });
  const f = fields(root);
  f.groupChoice.props.onChange({ target: { value: "new" } });
  input(f.command, "echo hi");
  await nextTick();
  findAll(root, (node) => node.type === "form")[0].props.onSubmit({ preventDefault() {} });
  assert.deepEqual(JSON.parse(JSON.stringify(store.commands)), { new: [{ command: "echo hi", description: "" }] });
});

test("All commands add mode does not select an existing group implicitly", async () => {
  const { root } = await form({ commands: { Tools: [], Deploy: [] } });
  assert.equal(fields(root).groupChoice.props.value, "");
  assert.ok(fields(root).groupName, "All commands starts in the explicit new-group mode");
});

test("blank group and command cannot submit", async () => {
  const { root, store } = await form();
  findAll(root, (node) => node.type === "form")[0].props.onSubmit({ preventDefault() {} });
  await nextTick();
  assert.deepEqual(JSON.parse(JSON.stringify(store.commands)), {});
  assert.match(textContent(root), /Group and command are required/);
});

test("storage failure keeps the form input and reports the error", async () => {
  const { root, store } = await form({ fail: true });
  const f = fields(root);
  input(f.groupName, "Tools");
  input(f.command, "echo hi");
  await nextTick();
  findAll(root, (node) => node.type === "form")[0].props.onSubmit({ preventDefault() {} });
  await nextTick();
  assert.deepEqual(JSON.parse(JSON.stringify(store.commands)), {});
  assert.equal(fields(root).groupName.props.value, "Tools");
  assert.equal(fields(root).command.props.value, "echo hi");
  assert.match(textContent(root), /Could not save command: storage full/);
});

test("edit starts clean and group is read-only", async () => {
  const { root } = await form({ commands: { Tools: [{ command: "echo", description: "" }] }, editing: { group: "Tools", index: 0 } });
  const group = findAll(root, (node) => node.type === "input")[0];
  assert.ok("readonly" in group.props);
  assert.match(textContent(root), /Save changes/);
});

test("refresh/import guard asks before discarding dirty fields and respects rejection", async () => {
  let allowDiscard = false;
  let confirmations = 0;
  const store = reactive({ commands: { Tools: [{ command: "saved", description: "" }] }, importing: false, addCommand() {}, updateCommand() {} });
  const formComponent = await loadVueComponent(path, { "../../store/store": { store } });
  const listComponent = await loadVueComponent(resolve(import.meta.dirname, "../src/components/commands/ListCommands.vue"), {
    "../../store/store": { store }, "../../utils/confirmDialog": { default: async (_type, _content, _title, action) => { confirmations++; if (allowDiscard) action?.(); } },
  });
  const home = await loadVueComponent(resolve(import.meta.dirname, "../src/pages/Home.vue"), {
    "../components/commands/CreateCommandForm.vue": { default: formComponent },
    "../components/commands/ListCommands.vue": { default: listComponent },
    "../store/store": { store },
    "../utils/confirmDialog": { default: async (_type, _content, _title, action) => { confirmations++; if (allowDiscard) action?.(); } },
  });
  const mounted = mount(home);
  const exposed = mounted.app._instance.exposed;
  assert.equal(await exposed.prepareReplacement(), true, "a closed dialog does not block startup work");
  store.importing = true;
  findAll(mounted.root, (node) => node.type === "button" && textContent(node) === "Edit")[0].props.onClick();
  await nextTick();
  assert.equal(findAll(mounted.root, (node) => node.type === "form").length, 0, "an edit cannot open while file reading/import is busy");
  store.importing = false;
  const groupFilter = findAll(mounted.root, (node) => node.type === "select")[0];
  groupFilter.props.onChange({ target: { value: "Tools" } });
  findAll(mounted.root, (node) => node.type === "button" && textContent(node) === "Add command")[0].props.onClick();
  await nextTick();
  assert.equal(fields(mounted.root).groupChoice.props.value, "Tools", "Add command in a selected group preselects that group");
  input(fields(mounted.root).command, "unsaved");
  await nextTick();
  assert.equal(await exposed.prepareReplacement(), false);
  assert.equal(confirmations, 1);
  assert.ok(findAll(mounted.root, (node) => node.type === "form").length, "rejected discard keeps dialog open");
  let prevented = false;
  findAll(mounted.root, (node) => node.type === "dialog")[0].props.onCancel({ preventDefault() { prevented = true; } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(prevented, true, "Escape is handled by the dirty guard");
  assert.equal(confirmations, 2);
  assert.ok(findAll(mounted.root, (node) => node.type === "form").length);
  allowDiscard = true;
  assert.equal(await exposed.prepareReplacement(), true);
  await nextTick();
  assert.equal(confirmations, 3);
  assert.equal(findAll(mounted.root, (node) => node.type === "form").length, 0, "accepted discard closes before replacement");
});
