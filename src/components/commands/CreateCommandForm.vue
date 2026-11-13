<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { store } from "../../store/store";

const props = defineProps<{
  editing: { group: string; index: number } | null;
  opened: boolean;
  initialGroup: string;
}>();
const emit = defineEmits(["done", "cancel", "dirty"] as const);
const group = ref("");
const groupChoice = ref("");
const command = ref("");
const description = ref("");
const error = ref("");
let initial = ["", "", "", ""];

watch(
  () => [props.opened, props.editing, props.initialGroup] as const,
  () => {
    if (!props.opened) return;
    error.value = "";
    if (props.editing) {
      const item = store.commands[props.editing.group]?.[props.editing.index];
      group.value = props.editing.group;
      groupChoice.value = props.editing.group;
      command.value = item?.command ?? "";
      description.value = item?.description ?? "";
    } else {
      group.value = "";
      groupChoice.value = props.initialGroup;
      command.value = "";
      description.value = "";
    }
    initial = [
      groupChoice.value,
      group.value,
      command.value,
      description.value,
    ];
    emit("dirty", false);
  },
  { immediate: true },
);

const groups = computed(() => Object.keys(store.commands));
const isDirty = () =>
  [groupChoice.value, group.value, command.value, description.value].some(
    (value, index) => value !== initial[index],
  );
watch([groupChoice, group, command, description], () =>
  emit("dirty", isDirty()),
);

function submitForm() {
  const targetGroup = props.editing
    ? props.editing.group
    : groupChoice.value
      ? groupChoice.value
      : group.value.trim();
  if (!targetGroup || !command.value.trim()) {
    error.value = "Group and command are required.";
    return;
  }
  try {
    if (props.editing)
      store.updateCommand(props.editing.group, props.editing.index, {
        command: command.value,
        description: description.value,
      });
    else
      store.addCommand(targetGroup, {
        command: command.value,
        description: description.value,
      });
  } catch (cause) {
    error.value = `Could not save command: ${cause instanceof Error ? cause.message : String(cause)}`;
    return;
  }
  emit("done", props.editing ? "edited" : "added");
}
</script>

<template>
  <section class="create-command-form">
    <h2 :id="'command-dialog-title'">
      {{ props.editing ? "Edit command" : "Add command" }}
    </h2>
    <form @submit.prevent="submitForm">
      <div class="select-group">
        <label for="group">Group</label>
        <template v-if="props.editing"
          ><input id="group" :value="props.editing.group" readonly
        /></template>
        <template v-else>
          <select
            id="group"
            :value="groupChoice"
            aria-label="Group"
            @change="groupChoice = ($event.target as HTMLSelectElement).value"
          >
            <option v-for="grp in groups" :key="grp" :value="grp">
              {{ grp }}
            </option>
            <option value="">Create new group</option>
          </select>
          <label v-if="!groupChoice" for="new-group">New group name</label>
          <input
            v-if="!groupChoice"
            id="new-group"
            :value="group"
            type="text"
            placeholder="New group name"
            @input="group = ($event.target as HTMLInputElement).value"
          />
        </template>
      </div>
      <div class="command-input-container">
        <label for="command">Command</label>
        <div>
          <span class="dollar-sign">$</span
          ><textarea
            id="command"
            :value="command"
            rows="1"
            @input="command = ($event.target as HTMLTextAreaElement).value"
          />
        </div>
      </div>
      <div>
        <label for="description">Description (optional)</label
        ><textarea
          id="description"
          :value="description"
          @input="description = ($event.target as HTMLTextAreaElement).value"
        />
      </div>
      <p v-if="error" role="alert">{{ error }}</p>
      <div class="form-actions">
        <button class="button button-primary" type="submit">
          {{ props.editing ? "Save changes" : "Add command" }}
        </button>
        <button
          class="button button-secondary"
          type="button"
          @click="emit('cancel')"
        >
          Cancel
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.create-command-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 8px;
}
.create-command-form h2 {
  margin: 6px 0 20px;
  font-size: 20px;
}
.create-command-form form > div {
  width: 100%;
  margin-bottom: 16px;
}
.create-command-form form label {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 550;
  text-align: left;
}
.create-command-form form input,
.create-command-form form select,
.create-command-form form textarea {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.create-command-form form textarea {
  min-height: 84px;
  resize: vertical;
}
.create-command-form form #command {
  min-height: 76px;
  font: 13px/1.5 var(--mono);
}
.command-input-container > div {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.dollar-sign {
  display: grid;
  width: 34px;
  flex: none;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-subtle);
  color: var(--muted);
  font: 14px var(--mono);
}
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}
.create-command-form [role="alert"] {
  color: var(--danger);
}
@media (max-width: 520px) {
  .form-actions .button {
    flex: 1;
  }
}
</style>
