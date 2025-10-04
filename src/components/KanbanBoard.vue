<template>
  <div class="app-container">
    <!-- Сайдбар -->
    <div class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo" v-if="!isSidebarCollapsed">
          <span>🚀 Kanban</span>
        </div>
        <el-button 
          :icon="isSidebarCollapsed ? Expand : Fold" 
          @click="toggleSidebar"
          class="collapse-btn"
          text
          circle
        />
      </div>

      <div class="sidebar-content">
        <div class="projects-section">
          <div class="section-header" v-if="!isSidebarCollapsed">
            <span>Проекты</span>
            <el-button 
              type="primary" 
              :icon="Plus" 
              size="small" 
              circle 
              @click="openAddProjectDialog"
            />
          </div>
          <el-tooltip 
            v-else
            content="Добавить проект" 
            placement="right"
          >
            <el-button 
              type="primary" 
              :icon="Plus" 
              size="small" 
              circle 
              @click="openAddProjectDialog"
              class="icon-btn"
            />
          </el-tooltip>

          <div class="projects-list">
            <div
              v-for="project in projects"
              :key="project.id"
              class="project-item"
              :class="{ active: currentProject?.id === project.id }"
              @click="selectProject(project)"
            >
              <div class="project-icon">
                <el-icon><Folder /></el-icon>
              </div>
              <div class="project-info" v-if="!isSidebarCollapsed">
                <span class="project-name">{{ project.name }}</span>
                <span class="project-stats">
                  {{ getProjectStats(project) }}
                </span>
              </div>
              <div class="project-actions" v-if="!isSidebarCollapsed">
                <el-button
                  type="primary"
                  :icon="Edit"
                  size="small"
                  text
                  circle
                  @click.stop="openEditProjectDialog(project)"
                />
                <el-button
                  type="danger"
                  :icon="Delete"
                  size="small"
                  text
                  circle
                  @click.stop="openDeleteProjectDialog(project)"
                  :disabled="projects.length <= 1"
                />
              </div>
              <el-tooltip 
                v-else
                :content="project.name" 
                placement="right"
              >
                <div class="project-icon">
                  <el-icon><Folder /></el-icon>
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- Хедер с названием проекта -->
      <div class="project-header">
        <div class="project-title-section">
          <el-input
            v-if="currentProject"
            v-model="currentProject.name"
            class="project-title-input"
            placeholder="Название проекта"
            @blur="saveToLocalStorage"
          />
          <el-input
            v-if="currentProject"
            v-model="currentProject.description"
            class="project-description-input"
            placeholder="Добавить описание проекта..."
            type="textarea"
            :rows="2"
            @blur="saveToLocalStorage"
          />
          <h1 v-else class="project-title-placeholder">Выберите проект</h1>
        </div>
      </div>

      <!-- Вкладки представлений -->
      <div class="view-tabs">
        <el-tabs v-model="activeView" type="card" @tab-click="handleTabClick">
          <el-tab-pane label="Таблица" name="table">
            <TableView 
              :projects="projects"
              :current-project="currentProject"
              @update-task="updateTask"
              @delete-task="deleteTaskFromTable"
            />
          </el-tab-pane>
          <el-tab-pane label="Доска" name="board">
            <div class="kanban-view">
              <!-- Канбан доска -->
              <div class="board" v-if="currentProject">
                <draggable 
                  v-model="currentProject.columns" 
                  group="columns"
                  item-key="id"
                  class="columns-container"
                  @end="onColumnDragEnd"
                >
                  <template #item="{ element: column }">
                    <div class="column-wrapper">
                      <div class="column">
                        <div class="column-header">
                          <el-input
                            v-model="column.title"
                            @blur="updateColumnTitle(column)"
                            class="column-title-input"
                            :ref="`column-input-${column.id}`"
                          />
                          <div class="column-actions">
                            <el-button
                              type="primary"
                              :icon="Plus"
                              size="small"
                              circle
                              @click="openAddTaskDialog(column.id)"
                            />
                            <el-button
                              type="danger"
                              :icon="Delete"
                              size="small"
                              circle
                              @click="openDeleteColumnDialog(column)"
                              :disabled="currentProject.columns.length <= 1"
                            />
                          </div>
                        </div>

                        <draggable
                          v-model="column.tasks"
                          group="tasks"
                          item-key="id"
                          class="tasks"
                          @end="onTaskDragEnd"
                        >
                          <template #item="{ element: task }">
                            <div
                              class="task-card"
                              @click="openTaskDetails(task)"
                            >
                              <div class="task-content">
                                <div class="task-header">
                                  <p class="task-title">{{ task.title }}</p>
                                  <el-tag 
                                    size="small" 
                                    :type="getPriorityType(task.priority)"
                                    :effect="isOverdue(task.deadline) ? 'dark' : 'light'"
                                  >
                                    {{ task.priority }}
                                  </el-tag>
                                </div>
                                
                                <p class="task-description">{{ truncateDescription(task.description) }}</p>
                                
                                <div class="task-footer">
                                  <div class="task-meta">
                                    <div class="assignee-info" v-if="task.assignee">
                                      <el-avatar :size="20" :src="task.assignee.avatar" />
                                      <span class="assignee-name">{{ task.assignee.name }}</span>
                                    </div>
                                    <div v-if="task.deadline" class="deadline-info">
                                      <el-icon><Clock /></el-icon>
                                      <span :class="{ 'overdue': isOverdue(task.deadline) }">
                                        {{ formatDate(task.deadline) }}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div class="task-actions">
                                    <el-button
                                      type="danger"
                                      :icon="Delete"
                                      size="small"
                                      circle
                                      @click.stop="deleteTask(column.id, task.id)"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </template>
                        </draggable>

                        <div class="column-footer">
                          <el-button 
                            type="primary" 
                            text 
                            :icon="Plus"
                            @click="openAddTaskDialog(column.id)"
                          >
                            Добавить задачу
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </template>
                </draggable>

                <div class="add-column-section">
                  <el-button 
                    type="primary" 
                    :icon="Plus" 
                    @click="openAddColumnDialog"
                    class="add-column-btn"
                  >
                    Добавить колонку
                  </el-button>
                </div>
              </div>

              <!-- Пустое состояние -->
              <div v-else class="empty-state">
                <el-empty description="Выберите или создайте проект">
                  <el-button type="primary" @click="openAddProjectDialog">
                    Создать проект
                  </el-button>
                </el-empty>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Исполнители" name="assignee">
            <AssigneeView 
              :projects="projects"
              :current-project="currentProject"
              @update-task="updateTask"
            />
          </el-tab-pane>
          <el-tab-pane label="График" name="gantt">
            <GanttView 
              :projects="projects"
              :current-project="currentProject"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- Диалоги (остаются без изменений, но добавляем assignee в форму задачи) -->
    <el-dialog 
      v-model="projectDialogVisible" 
      :title="editingProject ? 'Редактирование проекта' : 'Новый проект'" 
      width="400"
    >
      <el-form :model="projectForm" label-width="100px">
        <el-form-item label="Название" required>
          <el-input 
            v-model="projectForm.name" 
            placeholder="Введите название проекта"
            maxlength="50"
            show-word-limit
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
          {{ editingProject ? 'Сохранить' : 'Создать' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог добавления/редактирования задачи с assignee -->
    <el-dialog 
      v-model="addTaskDialogVisible" 
      :title="'Новая задача в ' + getCurrentColumnTitle" 
      width="600"
    >
      <el-form :model="newTask" label-width="120px">
        <el-form-item label="Заголовок" required>
          <el-input v-model="newTask.title" autocomplete="off" />
        </el-form-item>
        
        <el-form-item label="Описание">
          <el-input 
            v-model="newTask.description" 
            type="textarea" 
            :rows="4"
            placeholder="Подробное описание задачи..."
          />
        </el-form-item>
        
        <el-form-item label="Исполнитель">
          <el-select v-model="newTask.assignee" placeholder="Выберите исполнителя" clearable>
            <el-option 
              v-for="user in teamMembers"
              :key="user.id"
              :label="user.name"
              :value="user"
            >
              <div style="display: flex; align-items: center;">
                <el-avatar :size="20" :src="user.avatar" style="margin-right: 8px;" />
                <span>{{ user.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="Приоритет">
          <el-select v-model="newTask.priority" placeholder="Выберите приоритет">
            <el-option label="Низкий" value="Низкий" />
            <el-option label="Средний" value="Средний" />
            <el-option label="Высокий" value="Высокий" />
            <el-option label="Критичный" value="Критичный" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Дедлайн">
          <el-date-picker
            v-model="newTask.deadline"
            type="datetime"
            placeholder="Выберите дату и время"
            format="DD.MM.YYYY HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="addTaskDialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="addTask" :disabled="!newTask.title.trim()">
          Добавить
        </el-button>
      </template>
    </el-dialog>

    <!-- Остальные диалоги остаются без изменений -->
    <!-- ... -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Delete, Clock, Edit, Fold, Expand, Folder } from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue } from '../utils/dateUtils'
import draggable from 'vuedraggable'
import TableView from './TableView.vue'
import AssigneeView from './AssigneeView.vue'
import GanttView from './GanttView.vue'

// Состояние интерфейса
const isSidebarCollapsed = ref(false)
const activeView = ref('board')

// Состояние проектов (расширяем структуру)
const projects = ref([
  {
    id: 1,
    name: 'Разработка продукта',
    description: 'Основной проект по разработке нового продукта',
    columns: [
      {
        id: 'todo',
        title: 'Бэклог',
        tasks: [
          { 
            id: 1, 
            title: 'Прототип интерфейса', 
            description: 'Создать прототип основного интерфейса в Figma', 
            priority: 'Высокий',
            deadline: '2024-12-31 18:00:00',
            createdAt: '2024-01-15 10:00:00',
            updatedAt: '2024-01-15 10:00:00',
            columnId: 'todo',
            assignee: { id: 1, name: 'Алексей Иванов', avatar: '' }
          }
        ]
      },
      {
        id: 'inProgress',
        title: 'В работе',
        tasks: [
          { 
            id: 2, 
            title: 'Разработать канбан-доску', 
            description: 'Создать канбан-доску на Vue 3 и Element Plus с drag-and-drop функционалом', 
            priority: 'Высокий',
            deadline: '2024-01-20 23:59:00',
            createdAt: '2024-01-10 14:20:00',
            updatedAt: '2024-01-15 11:30:00',
            columnId: 'inProgress',
            assignee: { id: 2, name: 'Мария Петрова', avatar: '' }
          }
        ]
      },
      {
        id: 'review',
        title: 'Ревью',
        tasks: [
          { 
            id: 3, 
            title: 'Тестирование API', 
            description: 'Протестировать endpoints REST API', 
            priority: 'Средний',
            deadline: '2024-01-18 17:00:00',
            createdAt: '2024-01-12 13:15:00',
            updatedAt: '2024-01-15 16:45:00',
            columnId: 'review',
            assignee: { id: 3, name: 'Дмитрий Сидоров', avatar: '' }
          }
        ]
      },
      {
        id: 'done',
        title: 'Готово',
        tasks: [
          { 
            id: 4, 
            title: 'Настройка проекта', 
            description: 'Инициализировать Vue приложение и настроить базовую структуру', 
            priority: 'Низкий',
            deadline: '2024-01-12 17:00:00',
            createdAt: '2024-01-08 13:15:00',
            updatedAt: '2024-01-12 16:45:00',
            columnId: 'done',
            assignee: { id: 1, name: 'Алексей Иванов', avatar: '' }
          }
        ]
      }
    ]
  }
])

// Команда проекта
const teamMembers = ref([
  { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer' },
  { id: 2, name: 'Мария Петрова', avatar: '', role: 'UI/UX Designer' },
  { id: 3, name: 'Дмитрий Сидоров', avatar: '', role: 'Backend Developer' },
  { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager' }
])

// Текущий проект
const currentProject = ref(projects.value[0])

// Состояние UI
const projectDialogVisible = ref(false)
const deleteProjectDialogVisible = ref(false)
const addTaskDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const deleteColumnDialogVisible = ref(false)

// Формы и временные данные
const projectForm = ref({ name: '', description: '' })
const editingProject = ref(null)
const projectToDelete = ref(null)
const columnToDelete = ref(null)
const currentColumnId = ref('')
const currentTask = ref(null)
const editingTask = ref(null)

const newTask = ref({
  title: '',
  description: '',
  priority: 'Средний',
  deadline: null,
  assignee: null
})

// Вычисляемые свойства
const getCurrentColumnTitle = computed(() => {
  if (!currentProject.value) return ''
  const column = currentProject.value.columns.find(col => col.id === currentColumnId.value)
  return column ? column.title : ''
})

const getProjectStats = (project) => {
  const totalTasks = project.columns.reduce((sum, column) => sum + column.tasks.length, 0)
  const completedTasks = project.columns.find(col => col.id === 'done')?.tasks.length || 0
  return `${completedTasks}/${totalTasks}`
}

// Методы для интерфейса
function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function handleTabClick(tab) {
  // При переключении вкладок можно добавить дополнительную логику
  console.log('Switched to tab:', tab.props.name)
}

// Методы для проектов (остаются в основном без изменений)
function selectProject(project) {
  currentProject.value = project
}

function openAddProjectDialog() {
  projectForm.value = { name: '', description: '' }
  editingProject.value = null
  projectDialogVisible.value = true
}

function openEditProjectDialog(project) {
  projectForm.value = { name: project.name, description: project.description || '' }
  editingProject.value = project
  projectDialogVisible.value = true
}

function openDeleteProjectDialog(project) {
  projectToDelete.value = project
  deleteProjectDialogVisible.value = true
}

function saveProject() {
  if (!projectForm.value.name.trim()) return

  if (editingProject.value) {
    editingProject.value.name = projectForm.value.name
    editingProject.value.description = projectForm.value.description
  } else {
    const newProject = {
      id: Date.now(),
      name: projectForm.value.name,
      description: projectForm.value.description,
      columns: [
        { id: 'todo', title: 'Бэклог', tasks: [] },
        { id: 'inProgress', title: 'В работе', tasks: [] },
        { id: 'review', title: 'Ревью', tasks: [] },
        { id: 'done', title: 'Готово', tasks: [] }
      ]
    }
    projects.value.push(newProject)
    currentProject.value = newProject
  }

  projectDialogVisible.value = false
  saveToLocalStorage()
}

function confirmDeleteProject() {
  if (!projectToDelete.value) return

  const index = projects.value.findIndex(p => p.id === projectToDelete.value.id)
  if (index !== -1) {
    projects.value.splice(index, 1)
    
    if (currentProject.value?.id === projectToDelete.value.id) {
      currentProject.value = projects.value[0] || null
    }
  }

  deleteProjectDialogVisible.value = false
  projectToDelete.value = null
  saveToLocalStorage()
}

// Методы для колонок (остаются без изменений)
function openAddColumnDialog() {
  if (!currentProject.value) return

  const newColumn = {
    id: `column-${Date.now()}`,
    title: 'Новая колонка',
    tasks: []
  }
  
  currentProject.value.columns.push(newColumn)
  saveToLocalStorage()
}

function updateColumnTitle(column) {
  if (!column.title.trim()) {
    column.title = 'Без названия'
  }
  saveToLocalStorage()
}

function openDeleteColumnDialog(column) {
  columnToDelete.value = column
  deleteColumnDialogVisible.value = true
}

function confirmDeleteColumn() {
  if (!columnToDelete.value || !currentProject.value) return

  const index = currentProject.value.columns.findIndex(col => col.id === columnToDelete.value.id)
  if (index !== -1) {
    currentProject.value.columns.splice(index, 1)
  }

  deleteColumnDialogVisible.value = false
  columnToDelete.value = null
  saveToLocalStorage()
}

// Методы для задач (обновлены для работы с assignee)
function openAddTaskDialog(columnId) {
  currentColumnId.value = columnId
  addTaskDialogVisible.value = true
  newTask.value = { 
    title: '', 
    description: '', 
    priority: 'Средний',
    deadline: null,
    assignee: null
  }
}

function addTask() {
  if (!newTask.value.title.trim() || !currentProject.value) return
  
  const column = currentProject.value.columns.find(col => col.id === currentColumnId.value)
  if (column) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    column.tasks.push({
      id: Date.now(),
      ...newTask.value,
      createdAt: now,
      updatedAt: now,
      columnId: currentColumnId.value
    })
  }
  
  addTaskDialogVisible.value = false
  saveToLocalStorage()
}

function deleteTask(columnId, taskId) {
  if (!currentProject.value) return
  
  const column = currentProject.value.columns.find(col => col.id === columnId)
  if (column) {
    column.tasks = column.tasks.filter(task => task.id !== taskId)
    saveToLocalStorage()
  }
}

// Метод для обновления задачи из дочерних компонентов
function updateTask(updatedTask) {
  if (!currentProject.value) return

  currentProject.value.columns.forEach(column => {
    const taskIndex = column.tasks.findIndex(t => t.id === updatedTask.id)
    if (taskIndex !== -1) {
      column.tasks[taskIndex] = { ...updatedTask }
    }
  })
  saveToLocalStorage()
}

// Метод для удаления задачи из таблицы
function deleteTaskFromTable(taskId) {
  if (!currentProject.value) return

  currentProject.value.columns.forEach(column => {
    column.tasks = column.tasks.filter(task => task.id !== taskId)
  })
  saveToLocalStorage()
}

// Остальные методы (openTaskDetails, closeTaskDetails, editTask, saveTask) остаются без изменений
// Drag and Drop методы остаются без изменений
// Вспомогательные методы остаются без изменений

// Локальное хранилище
function saveToLocalStorage() {
  localStorage.setItem('kanban-projects', JSON.stringify(projects.value))
  localStorage.setItem('kanban-team-members', JSON.stringify(teamMembers.value))
}

function loadFromLocalStorage() {
  const savedProjects = localStorage.getItem('kanban-projects')
  const savedTeam = localStorage.getItem('kanban-team-members')
  
  if (savedProjects) {
    try {
      projects.value = JSON.parse(savedProjects)
      currentProject.value = projects.value[0] || null
    } catch (e) {
      console.error('Error loading projects from localStorage:', e)
    }
  }
  
  if (savedTeam) {
    try {
      teamMembers.value = JSON.parse(savedTeam)
    } catch (e) {
      console.error('Error loading team from localStorage:', e)
    }
  }
}

// Таймер для обновления времени
let timeUpdateInterval = null

onMounted(() => {
  loadFromLocalStorage()
  
  timeUpdateInterval = setInterval(() => {
    projects.value = [...projects.value]
  }, 60000)
})

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

/* Сайдбар */
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  min-height: 60px;
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.collapse-btn {
  margin-left: auto;
}

.sidebar-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-weight: 600;
  color: #303133;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.project-item:hover {
  background-color: #f5f7fa;
}

.project-item.active {
  background-color: #ecf5ff;
}

.project-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  flex-shrink: 0;
}

.project-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.project-name {
  display: block;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-stats {
  font-size: 12px;
  color: #909399;
}

.project-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-item:hover .project-actions {
  opacity: 1;
}

.icon-btn {
  width: 100%;
  margin-bottom: 8px;
}

/* Основной контент */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: -220px;
}

.project-header {
  padding: 20px 24px 0;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.project-title-input {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.project-title-input :deep(.el-input__inner) {
  border: none;
  font-size: 28px;
  font-weight: 600;
  padding: 0;
  background: transparent;
  color: #303133;
}

.project-description-input {
  margin-bottom: 16px;
}

.project-description-input :deep(.el-textarea__inner) {
  border: none;
  padding: 0;
  background: transparent;
  color: #606266;
  resize: none;
}

.project-title-placeholder {
  color: #909399;
  font-size: 24px;
  margin: 0;
}

/* Вкладки */
.view-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-tabs :deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.view-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.view-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
}

/* Канбан доска */
.kanban-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.board {
  flex: 1;
  padding: 20px;
  overflow-x: auto;
  background: #f8f9fa;
}

.columns-container {
  display: flex;
  gap: 16px;
  height: 100%;
  align-items: flex-start;
  min-width: min-content;
}

.column-wrapper {
  min-width: 280px;
  max-width: 320px;
  flex-shrink: 0;
}

.column {
  background: white;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.column-title-input {
  flex: 1;
  margin-right: 8px;
}

.column-title-input :deep(.el-input__inner) {
  border: none;
  font-weight: 600;
  font-size: 14px;
  padding: 0;
  background: transparent;
}

.column-actions {
  display: flex;
  gap: 4px;
}

.tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 4px;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #409eff;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.task-title {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
  margin: 0;
  flex: 1;
  margin-right: 8px;
  line-height: 1.4;
}

.task-description {
  font-size: 12px;
  color: #7f8c8d;
  margin: 8px 0;
  line-height: 1.4;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.task-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.assignee-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.assignee-name {
  font-size: 12px;
  color: #606266;
}

.deadline-info, .no-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.task-actions {
  display: flex;
  gap: 4px;
}

.column-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.add-column-section {
  margin-left: 16px;
  flex-shrink: 0;
}

.add-column-btn {
  height: 100%;
  min-height: 200px;
  width: 280px;
  border: 2px dashed #dcdfe6;
  background: white;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  margin: 20px;
  border-radius: 8px;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .sidebar {
    width: 240px;
  }
  
  .sidebar.collapsed {
    width: 60px;
  }
  
  .column-wrapper {
    min-width: 260px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%);
  }
  
  .sidebar.collapsed {
    transform: translateX(0);
    width: 60px;
  }
  
  .main-content {
    margin-left: 0 !important;
  }
  
  .columns-container {
    flex-direction: column;
  }
  
  .column-wrapper {
    min-width: auto;
    max-width: none;
  }
  
  .add-column-section {
    margin-left: 0;
    margin-top: 16px;
  }
  
  .add-column-btn {
    width: 100%;
    min-height: 60px;
  }
}
</style>