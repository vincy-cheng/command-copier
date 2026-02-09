<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import confirmDialog from "../../utils/confirmDialog";

import { store } from "../../store/store";

const emit = defineEmits(["edit"] as const);

const openGroup = ref<string | null>(null);
const openMenu = ref<string | null>(null);

function toggleGroup(group: string) {
  openGroup.value = openGroup.value === group ? null : group;
}

function copyCommand(cmd: string) {
  navigator.clipboard.writeText(cmd);
}

function toggleMenu(group: string, index: number | string) {
  const key = `${group}-${index}`;
  openMenu.value = openMenu.value === key ? null : key;
}

async function confirmDelete(index: number) {
  const group = openGroup.value;

  if (group !== null) {
    await confirmDialog(
      "warning",
      "Confirm Deletion",
      "Are you sure you want to delete this command?",
      () => {
        store.removeCommand(group, index);
      },
    );
  }
}

function editCommand(group: string, index: number) {
  emit("edit", { group, index });
  openMenu.value = null;
}

const data = computed(() => {
  return Object.entries(store.commands);
});

function onDocumentClick(e: Event) {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  if (!target.closest) return;
  // if the click happened outside any menu-container, close menus
  if (!target.closest(".menu-container")) {
    openMenu.value = null;
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});
</script>

<template>
  <div class="list-commands">
    <h2>Stored Commands</h2>
    <div v-for="[group, value] in data" :key="group" class="accordion-item">
      <div class="accordion-header" @click="toggleGroup(group.toString())">
        <h3>{{ group }}</h3>
        <i v-if="openGroup === group" class="pi pi-minus"></i>
        <i v-else class="pi pi-plus"></i>
      </div>
      <div v-if="openGroup === group" class="accordion-content">
        <ul>
          <li v-for="[index, cmd] in value.entries()" :key="cmd.command">
            <div>
              <p>{{ cmd.description }}</p>
              <p>$ {{ cmd.command }}</p>
            </div>

            <div class="accordion-content-actions">
              <button @click="copyCommand(cmd.command)">
                <i class="pi pi-clipboard"></i>
              </button>

              <div class="menu-container accordion-content-actions">
                <button
                  class="menu-button"
                  @click.stop="toggleMenu(group, index)"
                >
                  <i class="pi pi-ellipsis-v"></i>
                </button>
                <div
                  v-if="openMenu === group + '-' + index"
                  class="menu-dropdown"
                >
                  <button class="menu-item" @click="editCommand(group, index)">
                    <i class="pi pi-pencil"></i>
                    Edit
                  </button>
                  <button
                    class="menu-item delete"
                    @click="confirmDelete(index)"
                  >
                    <i class="pi pi-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<style scoped>
.list-commands {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  margin-top: 20px;
}

.accordion-item {
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  background-color: #f7f7f7;
  color: black;
}

.accordion-header h3 {
  margin: 0;
}

.accordion-content {
  padding: 10px;
  border-top: 1px solid #ccc;
}

.accordion-content ul {
  list-style-type: none;
  padding: 0;
}

.accordion-content li {
  padding: 5px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  border-bottom: 1px solid #ccc;
}

.accordion-content button {
  height: fit-content;
}

.accordion-content-actions {
  display: flex;
  gap: 10px;
}

.menu-container {
  position: relative;
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  color: #000;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 120px;
  display: flex;
  flex-direction: column;
}

.menu-item {
  padding: 8px 12px;
  border: none;
  text-align: left;
  border-radius: 0;
}

.menu-item:hover {
  background: #797979;
}

.menu-item.delete {
  color: #dc2626;
}
</style>
