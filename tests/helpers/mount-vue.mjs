import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { compileScript, parse } from "@vue/compiler-sfc";
import * as vue from "vue";

export async function loadVueComponent(path, dependencies = {}, globals = {}) {
  const source = await readFile(path, "utf8");
  const { descriptor } = parse(source, { filename: path });
  const compiled = compileScript(descriptor, { id: path, inlineTemplate: true });
  const { outputText } = ts.transpileModule(compiled.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const document = globalThis.document ?? {
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return { focus() {} }; },
  };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require(name) {
      if (name === "vue") return vue;
      if (name.endsWith(".css")) return {};
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected import: ${name}`);
    },
    navigator: globals.navigator ?? globalThis.navigator,
    document,
    Error,
    String,
    console,
  });
  return module.exports.default;
}

export function mount(component, props = {}) {
  const renderer = vue.createRenderer({
    createElement: (type) => ({ type, props: {}, children: [], parent: null, text: "" }),
    createText: (text) => ({ type: "#text", text, parent: null }),
    createComment: (text) => ({ type: "#comment", text, parent: null }),
    setText: (node, text) => { node.text = text; },
    setElementText: (node, text) => { node.children = []; node.text = text; },
    patchProp: (node, key, _old, value) => { node.props[key] = value; },
    insert(node, parent, anchor = null) {
      if (node.parent) {
        const old = node.parent.children.indexOf(node);
        if (old >= 0) node.parent.children.splice(old, 1);
      }
      node.parent = parent;
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      if (index < 0) parent.children.push(node);
      else parent.children.splice(index, 0, node);
    },
    remove(node) {
      if (!node.parent) return;
      const index = node.parent.children.indexOf(node);
      if (index >= 0) node.parent.children.splice(index, 1);
      node.parent = null;
    },
    parentNode: (node) => node.parent,
    nextSibling(node) {
      if (!node.parent) return null;
      return node.parent.children[node.parent.children.indexOf(node) + 1] ?? null;
    },
  });
  const root = { type: "root", children: [], parent: null, text: "" };
  const app = renderer.createApp(component, props);
  app.mount(root);
  return { root, app };
}

export function findAll(node, predicate, found = []) {
  if (predicate(node)) found.push(node);
  for (const child of node.children ?? []) findAll(child, predicate, found);
  return found;
}

export function textContent(node) {
  return `${node.text ?? ""}${(node.children ?? []).map(textContent).join("")}`;
}
