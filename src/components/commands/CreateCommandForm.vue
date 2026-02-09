<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { store } from "../../store/store";

const props = defineProps<{
  editing: { group: string; index: number } | null;
}>();
const emit = defineEmits(["done"] as const);

const group = ref("");
const command = ref("");
const description = ref("");

watch(
  () => props.editing,
  (val) => {
    if (
      val &&
      store.commands[val.group] &&
      store.commands[val.group][val.index]
    ) {
      const cmd = store.commands[val.group][val.index];
      group.value = val.group;
      command.value = cmd.command;
      description.value = cmd.description;
    } else if (!val) {
      group.value = "";
      command.value = "";
      description.value = "";
    }
  },
  { immediate: true },
);

function submitForm() {
  if (props.editing) {
    store.updateCommand(props.editing.group, props.editing.index, {
      command: command.value,
      description: description.value,
    });
    emit("done");
  } else {
    store.addCommand(group.value, {
      command: command.value,
      description: description.value,
    });
    group.value = "";
    command.value = "";
    description.value = "";
  }
}

const groups = computed(() => {
  return Object.keys(store.commands);
});
</script>

<template>
  <div class="create-command-form">
    <h1>{{ props.editing ? "Edit Command" : "Create Command" }}</h1>

    <form @submit.prevent="submitForm">
      <div class="select-group">
        <label for="group">Group:</label>
        <div>
          <select v-model="group" class="">
            <option v-for="grp in groups" :key="grp" :value="grp">
              {{ grp }}
            </option>
            <option :value="group">Create new group</option>
          </select>
          <input
            type="text"
            v-model="group"
            placeholder="Enter new group"
            required
          />
        </div>
      </div>
      <div class="command-input-container">
        <label for="command">Command:</label>

        <div>
          <span class="dollar-sign">$</span>
          <textarea
            type="text"
            id="command"
            v-model="command"
            rows="1"
            required
          ></textarea>
        </div>
      </div>

      <div>
        <label for="description">Description:</label>
        <textarea id="description" v-model="description"></textarea>
      </div>

      <div style="display: flex; gap: 8px">
        <button type="submit">{{ props.editing ? "Save" : "Create" }}</button>
        <button type="button" v-if="props.editing" @click="emit('done')">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-command-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.create-command-form h1 {
  text-align: center;
}

.create-command-form-button {
  position: relative;

  background-color: #09090b;
  border: none;
  color: white;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-command-form-button:hover {
  background-color: #18181b;
}

.create-command-form-button .icon {
  width: 24px;
  height: 24px;
  color: white; /* Ensure the icon color is white */
}

.create-command-form form div {
  width: 100%;
  margin-bottom: 15px;
}

.create-command-form form .formGroup {
  display: flex;
  gap: 1rem;
}

.create-command-form form label {
  display: block;
  margin-bottom: 5px;
  text-align: left;
}

.create-command-form form input,
.create-command-form form textarea {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 0;
  border-radius: 4px;
  color: white;
  background-color: #09090b;
}

.create-command-form form button {
  display: block;
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.create-command-form form button:hover {
  background-color: #0056b3;
}

.command-input-container {
  position: relative;
}

.command-input-container div {
  display: flex;
  align-items: center;
  background-color: #09090b;
  border: 0;
  border-radius: 4px;
  box-sizing: border-box;
}
.dollar-sign {
  padding: 0 8px;
}

.create-command-form form textarea {
  font-size: medium;
}

.select-group div {
  display: flex;
  gap: 10px;
}

.select-group select {
  padding: 10px;
  border: 0;
  border-radius: 4px;
  color: white;
  background-color: #09090b;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 10px center;
}
</style>
