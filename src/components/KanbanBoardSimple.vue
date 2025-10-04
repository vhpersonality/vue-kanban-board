<template>
  <div class="app-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span>🚀 Kanban Pro</span>
        </div>
      </div>
      
      <div class="projects-list">
        <div 
          v-for="project in projects" 
          :key="project.id"
          class="project-item"
          @click="selectProject(project)"
        >
          {{ project.name }}
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="project-header">
        <h1 v-if="currentProject">{{ currentProject.name }}</h1>
        <h1 v-else>Выберите проект</h1>
      </div>

      <div class="content">
        <p v-if="!currentProject">Пожалуйста, выберите проект из списка слева</p>
        <div v-else>
          <p>Проект загружен успешно!</p>
          <p>Всего задач: {{ totalTasks }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'

const store = useProjectsStore()

const projects = computed(() => store.projects || [])
const currentProject = computed(() => store.currentProject)

const totalTasks = computed(() => {
  if (!currentProject.value) return 0
  return currentProject.value.columns.reduce((total, column) => total + (column.tasks?.length || 0), 0)
})

function selectProject(project) {
  store.setCurrentProject(project)
}

onMounted(() => {
  console.log('KanbanBoardSimple mounted')
  // Автоматически выбираем первый проект если есть
  if (projects.value.length > 0 && !currentProject.value) {
    selectProject(projects.value[0])
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
}

.sidebar {
  width: 300px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 20px;
}

.sidebar-header {
  margin-bottom: 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary);
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.project-item {
  padding: 12px;
  background: var(--bg-primary);
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.project-item:hover {
  background: var(--primary);
  color: white;
}

.main-content {
  flex: 1;
  padding: 20px;
}

.project-header {
  margin-bottom: 20px;
}

.content {
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
}
</style>