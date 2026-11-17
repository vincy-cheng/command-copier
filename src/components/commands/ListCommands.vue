<script setup lang="ts">
import { ref, watch } from "vue";
import confirmDialog from "../../utils/confirmDialog";
import { store } from "../../store/store";

type ListedCommand = { command: string; description: string; index: number };
const props = defineProps<{
  groups: { group: string; commands: ListedCommand[] }[];
  empty: boolean;
}>();
const emit = defineEmits(["edit", "add", "clearFilters"] as const);

const feedback = ref<Record<string, string>>({});
const deleteError = ref("");

watch(
  () => store.commands,
  () => { feedback.value = {}; },
  { deep: true },
);

function rowKey(group: string, index: number) {
  return `${group}-${index}`;
}

async function copyCommand(group: string, index: number, command: string) {
  const key = rowKey(group, index);
  const collection = store.commands;
  const row = collection[group]?.[index];
  try {
    await navigator.clipboard.writeText(command);
    if (
      store.commands !== collection ||
      collection[group]?.[index] !== row ||
      row?.command !== command
    ) return;
    feedback.value[key] = "Copied";
  } catch (error) {
    if (
      store.commands !== collection ||
      collection[group]?.[index] !== row ||
      row?.command !== command
    ) return;
    feedback.value[key] =
      `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function confirmDelete(group: string, index: number) {
  deleteError.value = "";
  try {
    await confirmDialog(
      "warning",
      "Are you sure you want to delete this command?",
      "Confirm Deletion",
      () => store.removeCommand(group, index),
    );
  } catch (error) {
    deleteError.value = `Delete failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}
</script>

<template>
  <div class="list-commands">
    <p v-if="deleteError" role="alert">{{ deleteError }}</p>
    <p v-if="props.empty">No commands saved yet.</p>
    <div v-else-if="props.groups.length === 0" class="empty-results">
      <p>No commands match these filters.</p>
      <button
        class="button button-secondary"
        type="button"
        @click="emit('clearFilters')"
      >
        Clear filters
      </button>
    </div>
    <section v-for="group in props.groups" :key="group.group" class="group">
      <h3>
        {{ group.group }} <span>({{ group.commands.length }})</span>
      </h3>
      <p v-if="group.commands.length === 0">No commands in this group yet.</p>
      <button
        v-if="group.commands.length === 0"
        class="button button-secondary"
        type="button"
        @click="emit('add', group.group)"
      >
        Add command
      </button>
      <ul v-else>
        <li v-for="item in group.commands" :key="item.index">
          <div class="command-detail">
            <p v-if="item.description">{{ item.description }}</p>
            <code>{{ item.command }}</code>
            <p
              v-if="feedback[rowKey(group.group, item.index)]"
              class="copy-feedback"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {{ feedback[rowKey(group.group, item.index)] }}
            </p>
          </div>
          <div class="row-actions">
            <button
              class="button button-secondary"
              type="button"
              :aria-label="`Copy command from ${group.group}`"
              @click="copyCommand(group.group, item.index, item.command)"
            >
              Copy
            </button>
            <button
              class="button button-secondary"
              type="button"
              :aria-label="`Edit command in ${group.group}`"
              @click="emit('edit', { group: group.group, index: item.index })"
            >
              Edit
            </button>
            <button
              class="button button-secondary button-danger"
              type="button"
              :aria-label="`Delete command from ${group.group}`"
              @click="confirmDelete(group.group, item.index)"
            >
              Delete
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.list-commands {
  width: 100%;
  min-width: 0;
  text-align: left;
}
.group {
  min-width: 0;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}
.group h3 {
  margin: 0 0 6px;
  font-size: 14px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.group h3 span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 400;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px 12px;
  padding: 16px 0 12px;
  border-top: 1px solid var(--line);
}
.command-detail {
  display: contents;
}
.command-detail p {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--muted);
}
.command-detail code {
  grid-column: 1;
  grid-row: 2;
  display: block;
  max-width: 100%;
  max-height: 120px;
  overflow: auto;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-subtle);
  color: var(--ink);
  font: 13px/1.5 var(--mono);
  white-space: pre;
  scrollbar-width: thin;
}
.copy-feedback {
  grid-column: 1 / -1;
  grid-row: 3;
  margin: 0 !important;
  color: var(--muted);
  font-size: 12px;
}
.row-actions {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 6px;
}
.row-actions .button {
  min-height: 44px;
  padding: 0 11px;
  font-size: 13px;
}
[role="alert"] {
  color: var(--danger);
}
.empty-results,
.list-commands > p {
  color: var(--muted);
}
@media (max-width: 520px) {
  li {
    grid-template-columns: minmax(0, 1fr);
  }
  .row-actions {
    grid-column: 1;
    grid-row: 3;
    width: 100%;
  }
  .row-actions .button {
    flex: 1;
  }
  .group {
    padding: 10px;
  }
}
</style>
