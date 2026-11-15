<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import CreateCommandForm from "../components/commands/CreateCommandForm.vue";
import ListCommands from "../components/commands/ListCommands.vue";
import { store } from "../store/store";
import confirmDialog from "../utils/confirmDialog";

const editState = ref<{ group: string; index: number } | null>(null);
const opened = ref(false);
const dirty = ref(false);
const initialGroup = ref("");
const dialog = ref<HTMLDialogElement | null>(null);
const opener = ref<HTMLElement | null>(null);
const feedback = ref("");
const query = ref("");
const selectedGroup = ref("");

const groups = computed(() => Object.keys(store.commands));
const filteredGroups = computed(() => {
  const search = query.value.trim().toLocaleLowerCase();
  return Object.entries(store.commands)
    .filter(([group]) => !selectedGroup.value || group === selectedGroup.value)
    .map(([group, commands]) => ({
      group,
      commands: commands.flatMap((command, index) => {
        const matches =
          !search ||
          [group, command.command, command.description].some((value) =>
            value.toLocaleLowerCase().includes(search),
          );
        return matches ? [{ ...command, index }] : [];
      }),
    }))
    .filter(
      ({ group, commands }) =>
        commands.length > 0 ||
        !search ||
        group.toLocaleLowerCase().includes(search),
    );
});

watch(groups, (current) => {
  if (selectedGroup.value && !current.includes(selectedGroup.value))
    selectedGroup.value = "";
});

function onEdit(payload: { group: string; index: number }) {
  if (store.importing || opened.value) return;
  opener.value = document.activeElement as HTMLElement;
  editState.value = payload;
  initialGroup.value = payload.group;
  opened.value = true;
}

watch(opened, async (value) => {
  if (value) {
    dialog.value?.showModal?.();
    await nextTick();
    dialog.value?.querySelector?.("textarea")?.focus?.();
  }
});

function closeForm() {
  opened.value = false;
  dirty.value = false;
  editState.value = null;
  dialog.value?.close?.();
}

function onDone(action: "added" | "edited") {
  feedback.value =
    action === "added"
      ? query.value || selectedGroup.value
        ? "Command added. Clear filters to view it."
        : "Command added."
      : "Command updated.";
  closeForm();
}

async function requestClose() {
  if (dirty.value) {
    let confirmed = false;
    try {
      await confirmDialog(
        "warning",
        "Discard unsaved changes?",
        "Unsaved changes",
        () => {
          confirmed = true;
        },
      );
    } catch {
      return false;
    }
    if (!confirmed) return false;
  }
  closeForm();
  return true;
}

async function prepareReplacement() {
  if (!opened.value) return true;
  if (!(await requestClose())) return false;
  return true;
}

function onDialogCancel(event: Event) {
  event.preventDefault();
  void requestClose();
}

function onDialogClose() {
  if (!opened.value) {
    const target = opener.value?.isConnected
      ? opener.value
      : document.querySelector<HTMLElement>(".add-command-trigger");
    target?.focus?.();
  }
}

function onAdd(group = "") {
  if (store.importing || opened.value) return;
  opener.value = document.activeElement as HTMLElement;
  editState.value = null;
  initialGroup.value = group;
  feedback.value = "";
  opened.value = true;
}

defineExpose({ prepareReplacement });

function clearFilters() {
  query.value = "";
  selectedGroup.value = "";
}
</script>

<template>
  <div class="home">
    <div class="library-heading">
      <div>
        <h2>Command library</h2>
        <p class="library-count">
          {{
            filteredGroups.reduce(
              (count, group) => count + group.commands.length,
              0,
            )
          }}
          commands
        </p>
      </div>
      <button
        class="button button-primary add-command-trigger"
        type="button"
        :disabled="store.importing"
        @click="onAdd(selectedGroup)"
      >
        Add command
      </button>
    </div>
    <p class="feedback" role="status" aria-live="polite" aria-atomic="true">
      {{ feedback }}
    </p>
    <button
      v-if="feedback === 'Command added. Clear filters to view it.'"
      class="button button-secondary clear-filter-feedback"
      type="button"
      @click="clearFilters"
    >
      Clear filters
    </button>
    <div class="library-layout">
      <aside class="group-sidebar" aria-label="Command groups">
        <p class="sidebar-label">Groups</p>
        <button
          type="button"
          :aria-pressed="selectedGroup === ''"
          @click="selectedGroup = ''"
        >
          All groups
          <span>{{
            groups.reduce(
              (count, group) => count + store.commands[group].length,
              0,
            )
          }}</span>
        </button>
        <button
          v-for="group in groups"
          :key="group"
          type="button"
          :aria-pressed="selectedGroup === group"
          @click="selectedGroup = group"
        >
          {{ group }} <span>{{ store.commands[group].length }}</span>
        </button>
      </aside>
      <section class="library" aria-label="Command library results">
        <div class="library-filters">
          <label for="command-search">Search commands</label>
          <input
            id="command-search"
            type="search"
            placeholder="Search commands"
            :value="query"
            @input="query = ($event.target as HTMLInputElement).value"
          />
          <label class="mobile-group-filter" for="group-filter"
            >Group
            <select
              id="group-filter"
              aria-label="Group filter"
              :value="selectedGroup"
              @change="
                selectedGroup = ($event.target as HTMLSelectElement).value
              "
            >
              <option value="">All groups</option>
              <option v-for="group in groups" :key="group" :value="group">
                {{ group }}
              </option>
            </select>
          </label>
        </div>
        <ListCommands
          :groups="filteredGroups"
          :empty="groups.length === 0"
          @edit="onEdit"
          @add="onAdd"
          @clear-filters="clearFilters"
        />
      </section>
    </div>
    <dialog
      ref="dialog"
      aria-labelledby="command-dialog-title"
      @cancel="onDialogCancel"
      @close="onDialogClose"
    >
      <button
        class="button button-secondary dialog-close"
        type="button"
        aria-label="Close dialog"
        @click="requestClose"
      >
        Close
      </button>
      <CreateCommandForm
        v-if="opened"
        :editing="editState"
        :opened="opened"
        :initial-group="initialGroup"
        @dirty="dirty = $event"
        @done="onDone"
        @cancel="requestClose"
      />
    </dialog>
  </div>
</template>

<style scoped>
.home {
  min-width: 0;
}
.library-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 0 16px;
}
.library-heading h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  letter-spacing: -0.015em;
}
.library-count {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.feedback {
  min-height: 0;
  margin: 0;
  color: var(--muted);
}
.feedback:not(:empty) {
  margin-bottom: 8px;
}
.clear-filter-feedback {
  margin-bottom: 12px;
}
.library-layout {
  display: grid;
  grid-template-columns: minmax(120px, 160px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.group-sidebar {
  display: grid;
  gap: 4px;
  padding: 8px 0;
  border-right: 1px solid var(--line);
  min-width: 0;
}
.sidebar-label {
  margin: 0 8px 4px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}
.group-sidebar button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 44px;
  margin-right: 8px;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  overflow-wrap: anywhere;
}
.group-sidebar button[aria-pressed="true"] {
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
  color: var(--accent);
  font-weight: 600;
}
.group-sidebar button span {
  flex: none;
  color: var(--muted);
  font-size: 12px;
}
.library {
  min-width: 0;
}
.library-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38%;
  align-items: end;
  gap: 10px;
  margin-bottom: 12px;
}
.library-filters > label:first-child {
  grid-column: 1 / -1;
  margin-bottom: -6px;
  color: var(--muted);
  font-size: 13px;
}
.library-filters input,
.library-filters select {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.mobile-group-filter {
  display: none;
}
dialog {
  position: fixed;
  width: min(560px, calc(100vw - 32px));
  max-width: 100%;
  max-height: min(90vh, 720px);
  overflow: auto;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-dialog);
}
dialog::backdrop {
  background: #10182080;
}
.dialog-close {
  display: block;
  margin-left: auto;
}
@media (max-width: 640px) {
  .library-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .group-sidebar {
    display: none;
  }
  .mobile-group-filter {
    display: grid;
    flex: 0 0 38%;
    gap: 4px;
    color: var(--muted);
    font-size: 12px;
  }
  .mobile-group-filter select {
    color: var(--ink);
    font-size: 14px;
  }
}
@media (max-width: 420px) {
  .library-heading {
    padding-top: 18px;
  }
  .library-heading h2 {
    font-size: 17px;
  }
  .library-heading .button {
    padding: 0 10px;
  }
}
</style>
