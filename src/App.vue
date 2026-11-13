<script setup lang="ts">
import "primeicons/primeicons.css";
import { onMounted, ref } from "vue";

import Home from "./pages/Home.vue";
import { store } from "./store/store";

const loadError = ref("");
const home = ref<InstanceType<typeof Home> | null>(null);

async function refreshCommands() {
  if (
    home.value?.prepareReplacement &&
    !(await home.value.prepareReplacement())
  )
    return;
  loadError.value = "";
  try {
    await store.refreshCommands();
  } catch (error) {
    loadError.value = `Could not load commands: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function exportCommands() {
  store.exportCommands();
}

async function importCommands() {
  if (
    home.value?.prepareReplacement &&
    !(await home.value.prepareReplacement())
  )
    return;
  await store.importCommands();
}

onMounted(() => {
  refreshCommands();
});
</script>

<template>
  <main class="container">
    <header class="app-header">
      <h1>Command Copier</h1>
      <nav class="data-actions" aria-label="Command data">
        <button
          class="button button-secondary"
          type="button"
          @click="refreshCommands"
        >
          <i class="pi pi-refresh" aria-hidden="true"></i>
          <span>Refresh</span>
        </button>
        <button
          class="button button-secondary"
          type="button"
          @click="importCommands"
        >
          <i class="pi pi-file-import" aria-hidden="true"></i>
          <span>Import</span>
        </button>
        <button
          class="button button-secondary"
          type="button"
          @click="exportCommands"
        >
          <i class="pi pi-file-export" aria-hidden="true"></i>
          <span>Export</span>
        </button>
      </nav>
    </header>
    <p v-if="loadError" role="alert">{{ loadError }}</p>
    <Home ref="home" />
  </main>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 60px;
  border-bottom: 1px solid var(--line);
}
.app-header h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 650;
  letter-spacing: -0.025em;
}
.data-actions {
  display: flex;
  gap: 8px;
}
</style>
<style>
:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 400;
  color: #202938;
  background: #f3f5f8;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --surface: #fff;
  --surface-subtle: #f7f8fa;
  --ink: #202938;
  --muted: #5c697a;
  --line: #dce2e9;
  --accent: #1769d2;
  --accent-hover: #0e58b8;
  --focus: #1769d2;
  --danger: #b42318;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --radius: 8px;
  --shadow-dialog: 0 20px 60px #11182735;
}
@media (prefers-color-scheme: dark) {
  :root {
    color: #e6eaf0;
    background: #161a20;
    --surface: #20262e;
    --surface-subtle: #272e38;
    --ink: #e6eaf0;
    --muted: #a3adba;
    --line: #3a4451;
    --accent: #71aaff;
    --accent-hover: #91bbff;
    --focus: #91bbff;
    --danger: #ff938a;
    --shadow-dialog: 0 20px 60px #0009;
  }
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}
button {
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
button,
input,
select,
textarea {
  border-radius: var(--radius);
}
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
.container {
  width: min(100%, 1100px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 0 24px 24px;
}
.button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-weight: 550;
  transition:
    border-color 120ms ease,
    background-color 120ms ease,
    transform 90ms ease;
}
.button:hover {
  border-color: #9aa9bb;
  background: var(--surface-subtle);
}
.button:active {
  transform: translateY(1px);
}
.button-primary {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}
.button-primary:hover {
  border-color: var(--accent-hover);
  background: var(--accent-hover);
  color: #fff;
}
.button-danger {
  color: var(--danger);
}
@media (prefers-color-scheme: dark) {
  .button-primary,
  .button-primary:hover {
    color: #101820;
  }
}
@media (max-width: 520px) {
  .container {
    padding: 0 16px 16px;
  }
  .app-header {
    align-items: flex-start !important;
    flex-direction: column;
    padding: 14px 0;
  }
  .data-actions {
    width: 100%;
  }
  .data-actions .button {
    flex: 1;
    padding: 0 8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
