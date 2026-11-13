<script setup lang="ts">
import { computed, ref, watch } from "vue";
import CreateCommandForm from "../components/commands/CreateCommandForm.vue";
import ListCommands from "../components/commands/ListCommands.vue";
import { store } from "../store/store";

const editState = ref<{ group: string; index: number } | null>(null);
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
  editState.value = payload;
}

function onDone() {
  editState.value = null;
}

function clearFilters() {
  query.value = "";
  selectedGroup.value = "";
}

function onAdd() {
  editState.value = null;
  document.querySelector<HTMLTextAreaElement>(".create-command-form textarea")?.focus();
}
</script>

<template>
  <div class="home">
    <!-- <p>Copy and manage your commands easily.</p> -->
    <div class="grid-container">
      <CreateCommandForm :editing="editState" @done="onDone" />
      <section class="library">
        <h2>Command library</h2>
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
