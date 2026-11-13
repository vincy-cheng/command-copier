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
        const matches = !search || [group, command.command, command.description]
          .some((value) => value.toLocaleLowerCase().includes(search));
        return matches ? [{ ...command, index }] : [];
      }),
    }))
    .filter(({ group, commands }) =>
      commands.length > 0 || !search || group.toLocaleLowerCase().includes(search),
    );
});

watch(groups, (current) => {
  if (selectedGroup.value && !current.includes(selectedGroup.value)) selectedGroup.value = "";
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
  feedback.value = action === "added"
    ? query.value || selectedGroup.value ? "Command added. Clear filters to view it." : "Command added."
    : "Command updated.";
  closeForm();
}

async function requestClose() {
  if (dirty.value) {
    let confirmed = false;
    try {
      await confirmDialog("warning", "Discard unsaved changes?", "Unsaved changes", () => { confirmed = true; });
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
    const target = opener.value?.isConnected ? opener.value : document.querySelector<HTMLElement>(".add-command-trigger");
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
    <!-- <p>Copy and manage your commands easily.</p> -->
    <div class="grid-container">
      <section class="library">
        <h2>Command library</h2>
        <button class="add-command-trigger" type="button" :disabled="store.importing" @click="onAdd(selectedGroup)">Add command</button>
        <p role="status" aria-live="polite">{{ feedback }}</p>
        <button v-if="feedback === 'Command added. Clear filters to view it.'" type="button" @click="clearFilters">Clear filters</button>
        <label>
          Search commands
          <input
            type="search"
            placeholder="Search commands"
            :value="query"
            @input="query = ($event.target as HTMLInputElement).value"
          />
        </label>
        <label>
          Group
          <select aria-label="Group filter" :value="selectedGroup" @change="selectedGroup = ($event.target as HTMLSelectElement).value">
            <option value="">All groups</option>
            <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
          </select>
        </label>
        <ListCommands
          :groups="filteredGroups"
          :empty="groups.length === 0"
          @edit="onEdit"
          @add="onAdd"
          @clear-filters="clearFilters"
        />
      </section>
    </div>
    <dialog ref="dialog" aria-labelledby="command-dialog-title" @cancel="onDialogCancel" @close="onDialogClose">
      <button type="button" aria-label="Close dialog" @click="requestClose">Close</button>
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
  text-align: center;
}
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr; /* Two columns with equal width */
  gap: 20px; /* Space between grid items */
  padding: 20px;
}
.library { min-width: 0; }
.library label { display: grid; gap: 4px; margin: 8px 0; text-align: left; }
.library input, .library select { width: 100%; }

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr; /* Single column layout for smaller screens */
  }
}
</style>
