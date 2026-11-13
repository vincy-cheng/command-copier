<script setup lang="ts">
import { ref } from "vue";
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

function rowKey(group: string, index: number) {
  return `${group}-${index}`;
}

async function copyCommand(group: string, index: number, command: string) {
  const key = rowKey(group, index);
  try {
    await navigator.clipboard.writeText(command);
    feedback.value[key] = "Copied";
  } catch (error) {
    feedback.value[key] = `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
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
  <div class="list-commands" aria-live="polite">
    <p v-if="deleteError" role="alert">{{ deleteError }}</p>
    <p v-if="props.empty">No commands saved yet.</p>
    <div v-else-if="props.groups.length === 0" class="empty-results">
      <p>No commands match these filters.</p>
      <button type="button" @click="emit('clearFilters')">Clear filters</button>
    </div>
    <section v-for="group in props.groups" :key="group.group" class="group">
      <h3>{{ group.group }} <span>({{ group.commands.length }})</span></h3>
      <p v-if="group.commands.length === 0">No commands in this group yet.</p>
      <button v-if="group.commands.length === 0" type="button" @click="emit('add', group.group)">Add command</button>
      <ul v-else>
        <li v-for="item in group.commands" :key="item.index">
          <div class="command-detail">
            <p v-if="item.description">{{ item.description }}</p>
            <code>{{ item.command }}</code>
            <p v-if="feedback[rowKey(group.group, item.index)]" role="status">
              {{ feedback[rowKey(group.group, item.index)] }}
            </p>
          </div>
          <div class="row-actions">
            <button type="button" @click="copyCommand(group.group, item.index, item.command)">Copy</button>
            <button type="button" @click="emit('edit', { group: group.group, index: item.index })">Edit</button>
            <button type="button" @click="confirmDelete(group.group, item.index)">Delete</button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.list-commands { width: 100%; max-width: 600px; margin: 20px auto 0; text-align: left; }
.group { border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px; padding: 10px; }
.group h3 { margin: 0 0 8px; }
ul { list-style: none; padding: 0; margin: 0; }
li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 0; border-top: 1px solid #ccc; }
.command-detail { min-width: 0; overflow-wrap: anywhere; }
.command-detail p { margin: 4px 0; }
code { white-space: pre-wrap; }
.row-actions { display: flex; flex-wrap: wrap; gap: 6px; }
[role="alert"] { color: #b91c1c; }
</style>
