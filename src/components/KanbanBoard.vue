<template>
  <div class="app-container">
    <!-- Сайдбар (остается без изменений) -->
    <div class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <!-- ... существующий код сайдбара ... -->
    </div>

    <!-- Основной контент -->
    <div class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- НОВАЯ ШАПКА С ПОЛЬЗОВАТЕЛЕМ -->
      <div class="top-header">
        <div class="header-left">
          <el-button :icon="Menu" @click="toggleSidebar" />
          <span class="app-title">Kanban Board</span>
        </div>
        <div class="user-menu">
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="currentUser.avatar" />
              <span class="user-name">{{ currentUser.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">Мой профиль</el-dropdown-item>
                <el-dropdown-item command="settings">Настройки</el-dropdown-item>
                <el-dropdown-item divided command="logout">Выйти</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Хедер проекта -->
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
              @open-task="openTaskDetails"
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
                                
                                <!-- ИСПРАВЛЕННОЕ ОТОБРАЖЕНИЕ ОПИСАНИЯ -->
                                <p class="task-description" v-if="task.description">
                                  {{ truncateDescription(task.description) }}
                                </p>
                                
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
          <!-- ИЗМЕНЕННАЯ ВКЛАДКА: вместо "Исполнители" -> "Мои задачи" -->
          <el-tab-pane label="Мои задачи" name="myTasks">
            <MyTasksView 
              :projects="projects"
              :current-user="currentUser"
              @update-task="updateTask"
              @open-task="openTaskDetails"
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

    <!-- ДИАЛОГ ДЕТАЛЕЙ ЗАДАЧИ - ИСПРАВЛЕННЫЙ -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="currentTask?.title" 
      width="700"
      @close="closeTaskDetails"
    >
      <div v-if="currentTask" class="task-details">
        <div class="detail-section">
          <h3>Описание</h3>
          <p class="task-full-description">{{ currentTask.description || 'Нет описания' }}</p>
        </div>
        
        <div class="detail-grid">
          <div class="detail-item">
            <label>Приоритет:</label>
            <el-tag :type="getPriorityType(currentTask.priority)">
              {{ currentTask.priority }}
            </el-tag>
          </div>
          
          <div class="detail-item">
            <label>Статус:</label>
            <span>{{ getColumnTitleById(currentTask.columnId) }}</span>
          </div>
          
          <div class="detail-item">
            <label>Исполнитель:</label>
            <div v-if="currentTask.assignee" class="assignee-display">
              <el-avatar :size="24" :src="currentTask.assignee.avatar" />
              <span>{{ currentTask.assignee.name }}</span>
            </div>
            <span v-else class="no-assignee">Не назначен</span>
          </div>
          
          <div class="detail-item">
            <label>Создана:</label>
            <span>{{ formatDate(currentTask.createdAt) }}</span>
          </div>
          
          <div class="detail-item">
            <label>Обновлена:</label>
            <span>{{ formatDate(currentTask.updatedAt) }}</span>
          </div>
          
          <div class="detail-item full-width">
            <label>Дедлайн:</label>
            <div class="deadline-display">
              <span v-if="currentTask.deadline" :class="{ 'overdue': isOverdue(currentTask.deadline) }">
                {{ formatDate(currentTask.deadline) }}
              </span>
              <span v-else class="no-deadline">Не установлен</span>
              
              <div v-if="currentTask.deadline" class="time-remaining">
                <el-tag :type="getTimeRemainingType(currentTask.deadline)" size="small">
                  {{ getTimeRemainingText(currentTask.deadline) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Трекинг времени</h3>
          <div class="time-tracking">
            <div class="time-item">
              <span class="time-label">В работе:</span>
              <span class="time-value">{{ calculateTimeInProgress(currentTask) }}</span>
            </div>
            <div class="time-item">
              <span class="time-label">Создана:</span>
              <span class="time-value">{{ getTimeSinceCreation(currentTask) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="closeTaskDetails">Закрыть</el-button>
        <el-button type="primary" @click="editTask(currentTask)">
          Редактировать
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог редактирования задачи -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="'Редактирование: ' + currentTask?.title" 
      width="600"
    >
      <el-form :model="editingTask" label-width="120px" v-if="editingTask">
        <el-form-item label="Заголовок" required>
          <el-input v-model="editingTask.title" autocomplete="off" />
        </el-form-item>
        
        <el-form-item label="Описание">
          <el-input 
            v-model="editingTask.description" 
            type="textarea" 
            :rows="4"
            placeholder="Подробное описание задачи..."
          />
        </el-form-item>
        
        <el-form-item label="Исполнитель">
          <el-select v-model="editingTask.assignee" placeholder="Выберите исполнителя" clearable>
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
          <el-select v-model="editingTask.priority" placeholder="Выберите приоритет">
            <el-option label="Низкий" value="Низкий" />
            <el-option label="Средний" value="Средний" />
            <el-option label="Высокий" value="Высокий" />
            <el-option label="Критичный" value="Критичный" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Дедлайн">
          <el-date-picker
            v-model="editingTask.deadline"
            type="datetime"
            placeholder="Выберите дату и время"
            format="DD.MM.YYYY HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="Статус">
          <el-select v-model="editingTask.columnId" placeholder="Выберите статус">
            <el-option 
              v-for="column in currentProject?.columns || []" 
              :key="column.id"
              :label="column.title" 
              :value="column.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="saveTask" :disabled="!editingTask?.title.trim()">
          Сохранить
        </el-button>
      </template>
    </el-dialog>

    <!-- Остальные диалоги (проекты, добавление задачи) остаются без изменений -->
    <!-- ... -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Delete, Clock, Edit, Fold, Expand, Folder, Menu, ArrowDown, User } from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue } from '../utils/dateUtils'
import draggable from 'vuedraggable'
import TableView from './TableView.vue'
import MyTasksView from './MyTasksView.vue' // ИЗМЕНЕННЫЙ КОМПОНЕНТ
import GanttView from './GanttView.vue'

// ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
const currentUser = ref({
  id: 1,
  name: 'Алексей Иванов',
  avatar: '',
  email: 'alexey@company.com',
  role: 'Frontend Developer'
})

// Состояние интерфейса
const isSidebarCollapsed = ref(false)
const activeView = ref('board')

// Команда проекта
const teamMembers = ref([
  { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer' },
  { id: 2, name: 'Мария Петрова', avatar: '', role: 'UI/UX Designer' },
  { id: 3, name: 'Дмитрий Сидоров', avatar: '', role: 'Backend Developer' },
  { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager' }
])

// Состояние проектов
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
            description: 'Создать прототип основного интерфейса в Figma с учетом пользовательского опыта и современных тенденций дизайна', 
            priority: 'Высокий',
            deadline: '2024-12-31 18:00:00',
            createdAt: '2024-01-15 10:00:00',
            updatedAt: '2024-01-15 10:00:00',
            columnId: 'todo',
            assignee: { id: 2, name: 'Мария Петрова', avatar: '' }
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
            description: 'Создать канбан-доску на Vue 3 и Element Plus с drag-and-drop функционалом, responsive design и локальным хранилищем', 
            priority: 'Высокий',
            deadline: '2024-01-20 23:59:00',
            createdAt: '2024-01-10 14:20:00',
            updatedAt: '2024-01-15 11:30:00',
            columnId: 'inProgress',
            assignee: { id: 1, name: 'Алексей Иванов', avatar: '' }
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
            description: 'Протестировать endpoints REST API на корректность работы, производительность и безопасность', 
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
            description: 'Инициализировать Vue приложение и настроить базовую структуру проекта с роутингом и состоянием', 
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

// Текущий проект
const currentProject = ref(projects.value[0])

// Состояние UI
const projectDialogVisible = ref(false)
const deleteProjectDialogVisible = ref(false)
const addTaskDialogVisible = ref(false)
const detailDialogVisible = ref(false) // ДОБАВЛЕНО: состояние диалога деталей
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

// Методы для пользователя
function handleUserCommand(command) {
  switch (command) {
    case 'profile':
      // Открыть профиль пользователя
      break
    case 'settings':
      // Открыть настройки
      break
    case 'logout':
      // Выйти из системы
      break
  }
}

// ИСПРАВЛЕННЫЙ МЕТОД: открытие деталей задачи
function openTaskDetails(task) {
  currentTask.value = { ...task }
  detailDialogVisible.value = true
}

function closeTaskDetails() {
  detailDialogVisible.value = false
  currentTask.value = null
}

// ИСПРАВЛЕННЫЙ МЕТОД: обрезка описания
function truncateDescription(description) {
  if (!description) return ''
  return description.length > 100 ? description.substring(0, 100) + '...' : description
}

// Остальные методы остаются без изменений...
// (selectProject, openAddProjectDialog, saveProject, addTask, updateTask, и т.д.)

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

// Вспомогательные методы (getPriorityType, getTimeRemainingType, и т.д.) остаются без изменений

// Локальное хранилище
function saveToLocalStorage() {
  localStorage.setItem('kanban-projects', JSON.stringify(projects.value))
  localStorage.setItem('kanban-team-members', JSON.stringify(teamMembers.value))
  localStorage.setItem('kanban-current-user', JSON.stringify(currentUser.value))
}

function loadFromLocalStorage() {
  const savedProjects = localStorage.getItem('kanban-projects')
  const savedTeam = localStorage.getItem('kanban-team-members')
  const savedUser = localStorage.getItem('kanban-current-user')
  
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
  
  if (savedUser) {
    try {
      currentUser.value = JSON.parse(savedUser)
    } catch (e) {
      console.error('Error loading user from localStorage:', e)
    }
  }
}

onMounted(() => {
  loadFromLocalStorage()
  
  // Таймер для обновления времени
  const timeUpdateInterval = setInterval(() => {
    projects.value = [...projects.value]
  }, 60000)
  
  onUnmounted(() => {
    clearInterval(timeUpdateInterval)
  })
})
</script>

<style scoped>
/* НОВЫЕ СТИЛИ ДЛЯ ШАПКИ */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-menu {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

/* ИСПРАВЛЕННЫЕ СТИЛИ ДЛЯ ОПИСАНИЯ ЗАДАЧИ */
.task-description {
  font-size: 12px;
  color: #7f8c8d;
  margin: 8px 0;
  line-height: 1.4;
  word-wrap: break-word;
}

/* Стили для отображения исполнителя в деталях задачи */
.assignee-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-assignee {
  color: #c0c4cc;
  font-style: italic;
}

/* Остальные стили остаются без изменений */
/* ... */
</style>