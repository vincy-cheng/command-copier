<script setup lang="ts">
import { ref } from "vue";
import CreateCommandForm from "../components/commands/CreateCommandForm.vue";
import ListCommands from "../components/commands/ListCommands.vue";

const editState = ref<{ group: string; index: number } | null>(null);

function onEdit(payload: { group: string; index: number }) {
  editState.value = payload;
}

function onDone() {
  editState.value = null;
}
</script>

<template>
  <div class="home">
    <!-- <p>Copy and manage your commands easily.</p> -->
    <div class="grid-container">
      <CreateCommandForm :editing="editState" @done="onDone" />
      <ListCommands @edit="onEdit" />
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

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr; /* Single column layout for smaller screens */
  }
}
</style>
