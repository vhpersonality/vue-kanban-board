<template>
  <div class="app-container">
    <!-- Сайдбар -->
    <el-drawer
      v-model="sidebarVisible"
      title="Управление проектами"
      direction="ltr"
      size="300px"
      class="projects-sidebar"
    >
      <div class="sidebar-content">
        <div class="sidebar-header">
          <el-button type="primary" :icon="Plus" @click="openAddProjectDialog">
            Новый проект
          </el-button>
        </div>

        <div class="projects-list">
          <div
            v-for="project in projects"
            :key="project.id"
            class="project-item"
            :class="{ active: currentProject?.id === project.id }"
            @click="selectProject(project)"
          >
            <div class="project-info">
              <span class="project-name">{{ project.name }}</span>
              <span class="project-stats">
                {{ getProjectStats(project) }}
              </span>
            </div>
            <div class="project-actions">
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
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- Основной контент -->
    <div class="main-content">
      <!-- Хедер -->
      <div class="header">
        <div class="header-left">
          <el-button :icon="Menu" @click="sidebarVisible = true" />
          <h1>{{ currentProject?.name || 'Канбан Доска' }}</h1>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="openAddColumnDialog">
            Добавить колонку
          </el-button>
        </div>
      </div>

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
                            <div v-if="task.deadline" class="deadline-info">
                              <el-icon><Clock /></el-icon>
                              <span :class="{ 'overdue': isOverdue(task.deadline) }">
                                {{ formatDate(task.deadline) }}
                              </span>
                            </div>
                            <div v-else class="no-deadline">
                              <el-icon><Clock /></el-icon>
                              <span>Без срока</span>
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
      </div>

      <!-- Пустое состояние -->
      <div v-else class="empty-state">
        <el-empty description="Выберите или создайте проект">
          <el-button type="primary" @click="sidebarVisible = true">
            Управление проектами
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- Диалог добавления/редактирования проекта -->
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

    <!-- Диалог удаления проекта -->
    <el-dialog 
      v-model="deleteProjectDialogVisible" 
      title="Удаление проекта" 
      width="400"
    >
      <p>Вы уверены, что хотите удалить проект "{{ projectToDelete?.name }}"?</p>
      <p style="color: #f56c6c; margin-top: 10px;">
        Все задачи и колонки будут безвозвратно удалены.
      </p>
      
      <template #footer>
        <el-button @click="deleteProjectDialogVisible = false">Отмена</el-button>
        <el-button type="danger" @click="confirmDeleteProject">
          Удалить
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог добавления задачи -->
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

    <!-- Диалог деталей задачи -->
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

    <!-- Диалог удаления колонки -->
    <el-dialog 
      v-model="deleteColumnDialogVisible" 
      title="Удаление колонки" 
      width="400"
    >
      <p>Вы уверены, что хотите удалить колонку "{{ columnToDelete?.title }}"?</p>
      <p style="color: #f56c6c; margin-top: 10px;">
        Все задачи в этой колонке будут безвозвратно удалены.
      </p>
      
      <template #footer>
        <el-button @click="deleteColumnDialogVisible = false">Отмена</el-button>
        <el-button type="danger" @click="confirmDeleteColumn">
          Удалить
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Delete, Clock, Edit, Menu } from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue } from '../utils/dateUtils'
import draggable from 'vuedraggable'

// Состояние проектов
const projects = ref([
  {
    id: 1,
    name: 'Основной проект',
    columns: [
      {
        id: 'todo',
        title: 'Сделать',
        tasks: [
          { 
            id: 1, 
            title: 'Изучить Vue 3', 
            description: 'Прочитать документацию и сделать несколько примеров', 
            priority: 'Высокий',
            deadline: '2024-12-31 18:00:00',
            createdAt: '2024-01-15 10:00:00',
            updatedAt: '2024-01-15 10:00:00',
            columnId: 'todo'
          }
        ]
      },
      {
        id: 'inProgress',
        title: 'В процессе',
        tasks: [
          { 
            id: 2, 
            title: 'Разработать канбан-доску', 
            description: 'Создать канбан-доску на Vue 3 и Element Plus с drag-and-drop функционалом', 
            priority: 'Высокий',
            deadline: '2024-01-20 23:59:00',
            createdAt: '2024-01-10 14:20:00',
            updatedAt: '2024-01-15 11:30:00',
            columnId: 'inProgress'
          }
        ]
      },
      {
        id: 'done',
        title: 'Готово',
        tasks: [
          { 
            id: 3, 
            title: 'Создать проект', 
            description: 'Инициализировать Vue приложение и настроить базовую структуру', 
            priority: 'Низкий',
            deadline: '2024-01-12 17:00:00',
            createdAt: '2024-01-08 13:15:00',
            updatedAt: '2024-01-12 16:45:00',
            columnId: 'done'
          }
        ]
      }
    ]
  }
])

// Текущий проект
const currentProject = ref(projects.value[0])

// Состояние UI
const sidebarVisible = ref(false)
const projectDialogVisible = ref(false)
const deleteProjectDialogVisible = ref(false)
const addTaskDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const deleteColumnDialogVisible = ref(false)

// Формы и временные данные
const projectForm = ref({ name: '' })
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
  deadline: null
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

// Методы для проектов
function selectProject(project) {
  currentProject.value = project
  sidebarVisible.value = false
}

function openAddProjectDialog() {
  projectForm.value = { name: '' }
  editingProject.value = null
  projectDialogVisible.value = true
}

function openEditProjectDialog(project) {
  projectForm.value = { name: project.name }
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
    // Редактирование существующего проекта
    editingProject.value.name = projectForm.value.name
  } else {
    // Создание нового проекта
    const newProject = {
      id: Date.now(),
      name: projectForm.value.name,
      columns: [
        { id: 'todo', title: 'Сделать', tasks: [] },
        { id: 'inProgress', title: 'В процессе', tasks: [] },
        { id: 'done', title: 'Готово', tasks: [] }
      ]
    }
    projects.value.push(newProject)
    currentProject.value = newProject
  }

  projectDialogVisible.value = false
}

function confirmDeleteProject() {
  if (!projectToDelete.value) return

  const index = projects.value.findIndex(p => p.id === projectToDelete.value.id)
  if (index !== -1) {
    projects.value.splice(index, 1)
    
    // Если удалили текущий проект, выбираем первый доступный
    if (currentProject.value?.id === projectToDelete.value.id) {
      currentProject.value = projects.value[0] || null
    }
  }

  deleteProjectDialogVisible.value = false
  projectToDelete.value = null
}

// Методы для колонок
function openAddColumnDialog() {
  if (!currentProject.value) return

  const newColumn = {
    id: `column-${Date.now()}`,
    title: 'Новая колонка',
    tasks: []
  }
  
  currentProject.value.columns.push(newColumn)
  
  // Фокус на поле ввода названия
  nextTick(() => {
    const inputRef = `column-input-${newColumn.id}`
    if (inputRef) {
      // Здесь нужно получить ссылку на input и сфокусироваться
      // В реальной реализации используйте refs
    }
  })
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
}

// Методы для задач
function openAddTaskDialog(columnId) {
  currentColumnId.value = columnId
  addTaskDialogVisible.value = true
  newTask.value = { 
    title: '', 
    description: '', 
    priority: 'Средний',
    deadline: null
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

function openTaskDetails(task) {
  currentTask.value = { ...task }
  detailDialogVisible.value = true
}

function closeTaskDetails() {
  detailDialogVisible.value = false
  currentTask.value = null
}

function editTask(task) {
  editingTask.value = { ...task }
  detailDialogVisible.value = false
  editDialogVisible.value = true
}

function saveTask() {
  if (!editingTask.value?.title.trim() || !currentProject.value) return

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  editingTask.value.updatedAt = now

  // Находим задачу в исходной колонке и обновляем или перемещаем
  let found = false
  currentProject.value.columns.forEach(column => {
    const taskIndex = column.tasks.findIndex(t => t.id === editingTask.value.id)
    if (taskIndex !== -1) {
      // Если колонка изменилась, перемещаем задачу
      if (column.id !== editingTask.value.columnId) {
        column.tasks.splice(taskIndex, 1)
      } else {
        column.tasks[taskIndex] = { ...editingTask.value }
        found = true
      }
    }
  })

  // Если задача перемещается в другую колонку
  if (!found) {
    const targetColumn = currentProject.value.columns.find(col => col.id === editingTask.value.columnId)
    if (targetColumn) {
      targetColumn.tasks.push({ ...editingTask.value })
    }
  }

  editDialogVisible.value = false
  editingTask.value = null
  saveToLocalStorage()
}

// Drag and Drop
function onColumnDragEnd() {
  saveToLocalStorage()
}

function onTaskDragEnd(evt) {
  if (evt.to && evt.from && evt.item) {
    const taskId = parseInt(evt.item.dataset.id)
    const newColumnId = evt.to.dataset.columnId
    
    // Обновляем columnId у перемещенной задачи
    currentProject.value.columns.forEach(column => {
      const task = column.tasks.find(t => t.id === taskId)
      if (task) {
        task.columnId = newColumnId
        task.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    })
    
    saveToLocalStorage()
  }
}

// Вспомогательные методы
function truncateDescription(description) {
  if (!description) return 'Нет описания'
  return description.length > 100 ? description.substring(0, 100) + '...' : description
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

function getTimeRemainingType(deadline) {
  if (!deadline) return 'info'
  const timeRemaining = getTimeRemaining(deadline)
  if (timeRemaining?.expired) return 'danger'
  
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffHours = (deadlineDate - now) / (1000 * 60 * 60)
  
  if (diffHours < 24) return 'warning'
  if (diffHours < 72) return 'primary'
  return 'success'
}

function getTimeRemainingText(deadline) {
  const timeRemaining = getTimeRemaining(deadline)
  return timeRemaining ? timeRemaining.text : 'Без срока'
}

function getColumnTitleById(columnId) {
  if (!currentProject.value) return 'Неизвестно'
  const column = currentProject.value.columns.find(col => col.id === columnId)
  return column ? column.title : 'Неизвестно'
}

function calculateTimeInProgress(task) {
  if (!task.createdAt) return 'Неизвестно'
  
  const created = new Date(task.createdAt)
  const now = new Date()
  const diffMs = now - created
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (diffDays > 0) {
    return `${diffDays} д. ${diffHours} ч.`
  } else {
    return `${diffHours} ч.`
  }
}

function getTimeSinceCreation(task) {
  if (!task.createdAt) return 'Неизвестно'
  
  const created = new Date(task.createdAt)
  const now = new Date()
  const diffMs = now - created
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return '1 день назад'
  if (diffDays < 7) return `${diffDays} дня назад`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`
  
  return `${Math.floor(diffDays / 30)} мес. назад`
}

// Локальное хранилище
function saveToLocalStorage() {
  localStorage.setItem('kanban-projects', JSON.stringify(projects.value))
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('kanban-projects')
  if (saved) {
    try {
      projects.value = JSON.parse(saved)
      currentProject.value = projects.value[0] || null
    } catch (e) {
      console.error('Error loading from localStorage:', e)
    }
  }
}

// Таймер для обновления времени
let timeUpdateInterval = null

onMounted(() => {
  loadFromLocalStorage()
  
  // Обновляем отображение времени каждую минуту
  timeUpdateInterval = setInterval(() => {
    // Принудительное обновление через реактивность
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

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-bottom: 1px solid #e0e0e0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

/* Сайдбар */
.sidebar-content {
  padding: 20px;
}

.sidebar-header {
  margin-bottom: 20px;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.project-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
}

.project-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.project-info {
  flex: 1;
}

.project-name {
  display: block;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
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

/* Доска */
.board {
  flex: 1;
  padding: 20px;
  overflow-x: auto;
}

.columns-container {
  display: flex;
  gap: 20px;
  height: 100%;
  align-items: flex-start;
}

.column-wrapper {
  min-width: 300px;
  max-width: 350px;
}

.column {
  background: white;
  border-radius: 8px;
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.column-title-input {
  flex: 1;
  margin-right: 10px;
}

.column-title-input :deep(.el-input__inner) {
  border: none;
  font-weight: 600;
  font-size: 16px;
  padding: 0;
  background: transparent;
}

.column-actions {
  display: flex;
  gap: 5px;
}

.tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 5px;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #409eff;
  border: 1px solid #e0e0e0;
}

.task-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.task-title {
  font-weight: bold;
  font-size: 14px;
  color: #2c3e50;
  margin: 0;
  flex: 1;
  margin-right: 10px;
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
}

.deadline-info, .no-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.task-actions {
  display: flex;
  gap: 4px;
}

.column-footer {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Детали задачи */
.task-details {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  margin-bottom: 10px;
  color: #303133;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 5px;
}

.task-full-description {
  line-height: 1.6;
  color: #606266;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #909399;
  font-size: 12px;
}

.deadline-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-remaining {
  margin-left: 10px;
}

.time-tracking {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.time-label {
  font-weight: 600;
  color: #606266;
}

.time-value {
  color: #409eff;
  font-weight: 500;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .columns-container {
    flex-direction: column;
  }

  .column-wrapper {
    min-width: auto;
    max-width: none;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .time-tracking {
    grid-template-columns: 1fr;
  }

  .deadline-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>