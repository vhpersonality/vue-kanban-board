<template>
  <el-dialog
    v-model="dialogVisible"
    title="Быстрый переключатель"
    width="600px"
    @close="handleClose"
  >
    <el-input
      v-model="searchQuery"
      placeholder="Поиск проектов и задач..."
      :prefix-icon="Search"
      @input="handleSearch"
    />
    
    <div class="search-results">
      <div v-if="filteredProjects.length > 0" class="results-section">
        <h4>Проекты</h4>
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="result-item"
          @click="selectProject(project)"
        >
          <el-icon><Folder /></el-icon>
          <span class="item-title">{{ project.name }}</span>
        </div>
      </div>
      
      <div v-if="filteredTasks.length > 0" class="results-section">
        <h4>Задачи</h4>
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="result-item"
          @click="selectTask(task)"
        >
          <el-icon><Document /></el-icon>
          <span class="item-title">{{ task.title }}</span>
          <span class="item-subtitle">{{ getProjectName(task) }}</span>
        </div>
      </div>
      
      <div v-if="filteredProjects.length === 0 && filteredTasks.length === 0" class="no-results">
        Ничего не найдено
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, Folder, Document } from '@element-plus/icons-vue'
import { debounceFn } from '../utils/helpers'

const props = defineProps({
  modelValue: Boolean,
  projects: Array,
  tasks: Array
})

const emit = defineEmits(['update:modelValue', 'select-project', 'select-task'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchQuery = ref('')

const filteredProjects = computed(() => {
  if (!searchQuery.value) return props.projects.slice(0, 5)
  return props.projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).slice(0, 5)
})

const filteredTasks = computed(() => {
  if (!searchQuery.value) return props.tasks.slice(0, 5)
  return props.tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).slice(0, 5)
})

const handleSearch = debounceFn(() => {
  // Поиск уже в computed свойствах
}, 300)

function selectProject(project) {
  emit('select-project', project)
  dialogVisible.value = false
}

function selectTask(task) {
  emit('select-task', task)
  dialogVisible.value = false
}

function getProjectName(task) {
  const project = props.projects.find(p => 
    p.columns.some(col => col.tasks.some(t => t.id === task.id))
  )
  return project ? project.name : 'Проект'
}

function handleClose() {
  dialogVisible.value = false
  searchQuery.value = ''
}
</script>

<style scoped>
.search-results {
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.results-section {
  margin-bottom: 16px;
}

.results-section h4 {
  margin: 0 0 8px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.result-item:hover {
  background-color: var(--bg-secondary);
}

.item-title {
  flex: 1;
  font-weight: 500;
}

.item-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.no-results {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
}
</style>