import assert from "node:assert/strict";
import { test } from "node:test";
import { reactive } from "vue";
import { resolve } from "node:path";
import {
  findAll,
  loadVueComponent,
  mount,
  textContent,
} from "./helpers/mount-vue.mjs";

const repo = resolve(import.meta.dirname, "..");

async function renderList() {
  const store = reactive({
    commands: { Build: [{ command: "npm run build", description: "Compile" }] },
  });
  const list = await loadVueComponent(
    resolve(repo, "src/components/commands/ListCommands.vue"),
    {
      "../../store/store": { store },
      "../../utils/confirmDialog": { default: async () => {} },
    },
    { navigator: { clipboard: { writeText: async () => {} } } },
  );
  return mount(list, {
    groups: [
      {
        group: "Build",
        commands: [
          { command: "npm run build", description: "Compile", index: 0 },
        ],
      },
    ],
    empty: false,
  });
}

test("command actions have distinct accessible names and copy feedback is live", async () => {
  const { root } = await renderList();
  const buttons = findAll(root, (node) => node.type === "button");
  assert.deepEqual(
    buttons.map((button) => button.props["aria-label"]),
    [
      "Copy command from Build",
      "Edit command in Build",
      "Delete command from Build",
    ],
  );
  await buttons[0].props.onClick();
  const statuses = findAll(root, (node) => node.props?.role === "status");
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].props["aria-live"], "polite");
  assert.match(textContent(statuses[0]), /Copied/);
});

test("search and group filters expose visible labels", async () => {
  const store = reactive({ commands: { Build: [] } });
  const list = { render: () => null };
  const home = await loadVueComponent(resolve(repo, "src/pages/Home.vue"), {
    "../components/commands/CreateCommandForm.vue": { default: list },
    "../components/commands/ListCommands.vue": { default: list },
    "../store/store": { store },
    "../utils/confirmDialog": { default: async () => {} },
  });
  const { root } = mount(home);
  const search = findAll(
    root,
    (node) => node.type === "input" && node.props.type === "search",
  )[0];
  const group = findAll(
    root,
    (node) =>
      node.type === "select" && node.props["aria-label"] === "Group filter",
  )[0];
  assert.ok(search && group, "search and group controls are rendered");
  assert.ok(
    findAll(
      root,
      (node) =>
        node.type === "label" &&
        (node.props.for === search.props.id ||
          textContent(node).includes("Search commands")),
    ).length,
  );
  assert.ok(
    findAll(
      root,
      (node) => node.type === "label" && node.children?.includes(group),
    ).length,
  );
});
