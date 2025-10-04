<template>
  <el-dialog
    v-model="dialogVisible"
    title="Быстрый переход"
    width="600"
    :show-close="false"
    @close="handleClose"
    class="quick-switcher"
  >
    <div class="switcher-content">
      <el-input
        v-model="searchQuery"
        placeholder="Введите название проекта или задачи..."
        :prefix-icon="Search"
        size="large"
        @input="handleSearch"
        @keydown.down="moveSelection(1)"
        @keydown.up="moveSelection(-1)"
        @keydown.enter="selectCurrentItem"
        ref="searchInput"
      />
      
      <div class="search-results">
        <!-- Проекты -->
        <div class="results-section" v-if="filteredProjects.length > 0">
          <h4>Проекты</h4>
          <div
            v-for="(project, index) in filteredProjects"
            :key="project.id"
            class="result-item"
            :class="{ selected: selectedIndex === index && selectedType === 'project' }"
            @click="selectProject(project)"
            @mouseenter="setSelection(index, 'project')"
          >
            <el-icon><Folder /></el-icon>
            <span class="item-title">{{ project.name }}</span>
            <span class="item-meta">{{ getProjectStats(project) }}</span>
          </div>
        </div>
        
        <!-- Задачи -->
        <div class="results-section" v-if="filteredTasks.length > 0">
          <h4>Задачи</h4>
          <div
            v-for="(task, index) in filteredTasks"
            :key="task.id"
            class="result-item"
            :class="{ selected: selectedIndex === index && selectedType === 'task' }"
            @click="selectTask(task)"
            @mouseenter="setSelection(index + filteredProjects.length, 'task')"
          >
            <el-icon><Document /></el-icon>
            <span class="item-title">{{ task.title }}</span>
            <span class="item-meta">{{ getTaskProjectName(task) }} • {{ getStatusName(task.columnId) }}</span>
          </div>
        </div>
        
        <!-- Пустые результаты -->
        <div v-if="filteredProjects.length === 0 && filteredTasks.length === 0" class="empty-results">
          <el-empty description="Ничего не найдено" :image-size="80" />
        </div>
      </div>
      
      <div class="switcher-hint">
        <span class="hint-text">↕ Используйте стрелки для навигации</span>
        <span class="hint-text">↵ Enter для выбора</span>
        <span class="hint-text">ESC для отмены</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
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
const searchInput = ref(null)
const selectedIndex = ref(0)
const selectedType = ref('project')

// Фильтрация проектов и задач
const filteredProjects = computed(() => {
  if (!searchQuery.value) return props.projects.slice(0, 5)
  
  return props.projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).slice(0, 5)
})

const filteredTasks = computed(() => {
  if (!searchQuery.value) return props.tasks.slice(0, 5)
  
  return props.tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).slice(0, 5)
})

const totalResults = computed(() => filteredProjects.value.length + filteredTasks.value.length)

// Методы навигации
function moveSelection(direction) {
  if (totalResults.value === 0) return
  
  let newIndex = selectedIndex.value + direction
  
  if (newIndex < 0) {
    newIndex = totalResults.value - 1
  } else if (newIndex >= totalResults.value) {
    newIndex = 0
  }
  
  selectedIndex.value = newIndex
  
  // Определяем тип выбранного элемента
  if (newIndex < filteredProjects.value.length) {
    selectedType.value = 'project'
  } else {
    selectedType.value = 'task'
  }
}

function setSelection(index, type) {
  selectedIndex.value = index
  selectedType.value = type
}

function selectCurrentItem() {
  if (totalResults.value === 0) return
  
  if (selectedType.value === 'project' && filteredProjects.value[selectedIndex.value]) {
    selectProject(filteredProjects.value[selectedIndex.value])
  } else if (selectedType.value === 'task') {
    const taskIndex = selectedIndex.value - filteredProjects.value.length
    if (filteredTasks.value[taskIndex]) {
      selectTask(filteredTasks.value[taskIndex])
    }
  }
}

function selectProject(project) {
  emit('select-project', project)
  dialogVisible.value = false
  resetSearch()
}

function selectTask(task) {
  emit('select-task', task)
  dialogVisible.value = false
  resetSearch()
}

function getProjectStats(project) {
  const totalTasks = project.columns.reduce((sum, column) => sum + column.tasks.length, 0)
  return `${totalTasks} задач`
}

function getTaskProjectName(task) {
  const project = props.projects.find(p => 
    p.columns.some(col => col.tasks.some(t => t.id === task.id))
  )
  return project ? project.name : 'Неизвестный проект'
}

function getStatusName(columnId) {
  for (const project of props.projects) {
    const column = project.columns.find(col => col.id === columnId)
    if (column) return column.title
  }
  return 'Неизвестно'
}

function handleSearch() {
  selectedIndex.value = 0
  selectedType.value = filteredProjects.value.length > 0 ? 'project' : 'task'
}

function resetSearch() {
  searchQuery.value = ''
  selectedIndex.value = 0
  selectedType.value = 'project'
}

function handleClose() {
  resetSearch()
}

// Автофокус при открытии
watch(dialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})
</script>

<style scoped>
.quick-switcher :deep(.el-dialog__header) {
  padding-bottom: 0;
  margin-bottom: 0;
}

.quick-switcher :deep(.el-dialog__body) {
  padding-top: 16px;
}

.switcher-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
}

.results-section {
  margin-bottom: 16px;
}

.results-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 0 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.result-item:hover {
  background: var(--bg-secondary);
}

.result-item.selected {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  border-color: var(--primary);
}

.item-title {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.item-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.empty-results {
  padding: 20px;
  text-align: center;
}

.switcher-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.hint-text {
  font-size: 12px;
  color: var(--text-muted);
}

/* Адаптивность */
@media (max-width: 768px) {
  .switcher-hint {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
}
</style>