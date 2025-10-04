<template>
  <div class="app-container">
    <!-- Сайдбар -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span>🚀 Kanban Pro</span>
        </div>
      </div>

      <!-- Навигация -->
      <div class="sidebar-nav">
        <div 
          class="nav-item" 
          :class="{ active: activeNav === 'projects' }"
          @click="activeNav = 'projects'"
        >
          <el-icon><Folder /></el-icon>
          <span>Проекты</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: activeNav === 'team' }"
          @click="activeNav = 'team'"
        >
          <el-icon><User /></el-icon>
          <span>Команда</span>
        </div>
      </div>

      <!-- Список проектов -->
      <div class="projects-list">
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-item"
          :class="{ active: currentProject?.id === project.id }"
          @click="selectProject(project)"
        >
          <el-icon><Folder /></el-icon>
          <span class="project-name">{{ project.name }}</span>
          <span class="project-stats">
            {{ getProjectStats(project) }}
          </span>
        </div>
        
        <el-button 
          type="primary" 
          :icon="Plus" 
          @click="openAddProjectDialog"
          class="add-project-btn"
        >
          Добавить проект
        </el-button>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="main-content">
      <!-- Хедер проекта -->
      <div class="project-header">
        <div class="project-title-section">
          <h1 v-if="currentProject" class="project-title">{{ currentProject.name }}</h1>
          <h1 v-else class="project-placeholder">Выберите проект</h1>
          
          <p v-if="currentProject" class="project-description">
            {{ currentProject.description || 'Добавить описание проекта...' }}
          </p>
        </div>

        <div class="project-actions" v-if="currentProject">
          <el-button 
            type="primary" 
            :icon="Plus"
            @click="openAddTaskDialog()"
          >
            Добавить задачу
          </el-button>
        </div>
      </div>

      <!-- Вкладки представлений -->
      <div class="view-tabs">
        <el-tabs v-model="activeView" type="card">
          <el-tab-pane label="Доска" name="board">
            <div class="kanban-preview" v-if="currentProject">
              <div class="columns-preview">
                <div 
                  v-for="column in currentProject.columns" 
                  :key="column.id"
                  class="column-preview"
                >
                  <div class="column-header">
                    <h3>{{ column.title }}</h3>
                    <span class="task-count">{{ column.tasks?.length || 0 }}</span>
                  </div>
                  <div class="tasks-preview">
                    <div 
                      v-for="task in column.tasks?.slice(0, 3)" 
                      :key="task.id"
                      class="task-preview"
                      @click="openTaskDetails(task)"
                    >
                      <p class="task-title">{{ task.title }}</p>
                      <div class="task-meta">
                        <el-tag 
                          size="small" 
                          :type="getPriorityType(task.priority)"
                        >
                          {{ task.priority }}
                        </el-tag>
                      </div>
                    </div>
                    <div v-if="!column.tasks || column.tasks.length === 0" class="empty-column">
                      Нет задач
                    </div>
                  </div>
                </div>
              </div>
              <div class="preview-note">
                📝 Это предпросмотр канбан-доски. Полная версия будет добавлена позже.
              </div>
            </div>
            <div v-else class="empty-state">
              <p>Выберите проект для просмотра доски</p>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Таблица" name="table">
            <div class="table-preview" v-if="currentProject">
              <p>Табличное представление будет добавлено позже</p>
            </div>
            <div v-else class="empty-state">
              <p>Выберите проект для просмотра таблицы</p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- Диалог добавления проекта -->
    <el-dialog 
      v-model="projectDialogVisible" 
      title="Новый проект" 
      width="400"
    >
      <el-form :model="projectForm" label-width="100px">
        <el-form-item label="Название" required>
          <el-input 
            v-model="projectForm.name" 
            placeholder="Введите название проекта"
          />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input 
            v-model="projectForm.description" 
            type="textarea"
            placeholder="Описание проекта"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="projectDialogVisible = false">Отмена</el-button>
        <el-button 
          type="primary" 
          @click="saveProject"
          :disabled="!projectForm.name.trim()"
        >
          Создать
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог добавления задачи -->
    <el-dialog 
      v-model="addTaskDialogVisible" 
      title="Новая задача" 
      width="500"
    >
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="Название" required>
          <el-input 
            v-model="taskForm.title" 
            placeholder="Введите название задачи"
          />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input 
            v-model="taskForm.description" 
            type="textarea"
            placeholder="Описание задачи"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="Приоритет">
          <el-select v-model="taskForm.priority" placeholder="Выберите приоритет">
            <el-option label="Критичный" value="Критичный" />
            <el-option label="Высокий" value="Высокий" />
            <el-option label="Средний" value="Средний" />
            <el-option label="Низкий" value="Низкий" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="addTaskDialogVisible = false">Отмена</el-button>
        <el-button 
          type="primary" 
          @click="saveTask"
          :disabled="!taskForm.title.trim()"
        >
          Создать
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Folder, User, Plus } from '@element-plus/icons-vue'
import { useProjectsStore } from '../stores/projects'

const store = useProjectsStore()

// Состояние интерфейса
const activeView = ref('board')
const activeNav = ref('projects')
const projectDialogVisible = ref(false)
const addTaskDialogVisible = ref(false)

// Формы
const projectForm = ref({
  name: '',
  description: ''
})

const taskForm = ref({
  title: '',
  description: '',
  priority: 'Средний'
})

// Computed
const projects = computed(() => store.projects || [])
const currentProject = computed(() => store.currentProject)

function selectProject(project) {
  store.setCurrentProject(project)
}

function openAddProjectDialog() {
  projectForm.value = { name: '', description: '' }
  projectDialogVisible.value = true
}

function saveProject() {
  if (!projectForm.value.name.trim()) return
  
  const newProject = store.addProject(projectForm.value)
  projectDialogVisible.value = false
  
  // Автоматически выбираем новый проект
  if (newProject) {
    selectProject(newProject)
  }
}

function openAddTaskDialog() {
  taskForm.value = { title: '', description: '', priority: 'Средний' }
  addTaskDialogVisible.value = true
}

function saveTask() {
  if (!taskForm.value.title.trim()) return
  
  store.addTaskToColumn(currentProject.value.id, 'todo', taskForm.value)
  addTaskDialogVisible.value = false
}

function getProjectStats(project) {
  const totalTasks = project.columns?.reduce((sum, column) => sum + (column.tasks?.length || 0), 0) || 0
  return `${totalTasks} задач`
}

function getPriorityType(priority) {
  switch (priority) {
    case 'Критичный': return 'danger'
    case 'Высокий': return 'warning'
    case 'Средний': return 'primary'
    case 'Низкий': return 'success'
    default: return 'info'
  }
}

function openTaskDetails(task) {
  console.log('Open task details:', task)
  // Временная заглушка
  alert(`Задача: ${task.title}\nПриоритет: ${task.priority}`)
}

onMounted(() => {
  console.log('KanbanBoard mounted')
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

/* Сайдбар */
.sidebar {
  width: 300px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary);
}

.sidebar-nav {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.nav-item:hover {
  background: var(--bg-tertiary);
}

.nav-item.active {
  background: var(--primary);
  color: white;
}

.projects-list {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid var(--border-color);
}

.project-item:hover {
  background: var(--bg-tertiary);
}

.project-item.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.project-name {
  flex: 1;
  font-weight: 500;
}

.project-stats {
  font-size: 12px;
  opacity: 0.7;
}

.add-project-btn {
  margin-top: 16px;
  width: 100%;
}

/* Основной контент */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.project-header {
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.project-title-section {
  flex: 1;
}

.project-title {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.project-description {
  margin: 0;
  color: var(--text-secondary);
}

.project-placeholder {
  margin: 0;
  color: var(--text-muted);
}

.project-actions {
  margin-left: 20px;
}

/* Вкладки */
.view-tabs {
  flex: 1;
  padding: 0 32px;
  overflow: hidden;
}

.view-tabs :deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
}

/* Канбан превью */
.kanban-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.columns-preview {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 20px 0;
}

.column-preview {
  min-width: 280px;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-color);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.column-header h3 {
  margin: 0;
  font-size: 16px;
}

.task-count {
  background: var(--primary);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.tasks-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-preview {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-preview:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.task-title {
  margin: 0 0 8px 0;
  font-weight: 500;
  font-size: 14px;
}

.empty-column {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-style: italic;
}

.preview-note {
  margin-top: 20px;
  padding: 16px;
  background: var(--warning);
  color: white;
  border-radius: 6px;
  text-align: center;
}

/* Пустые состояния */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-muted);
}

.table-preview {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
}
</style>