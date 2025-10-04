// В начале файла с другими импортами
import ProjectDialog from './dialogs/ProjectDialog.vue'
import TeamMemberDialog from './dialogs/TeamMemberDialog.vue'
import TaskDialog from './dialogs/TaskDialog.vue'
import ColorPickerDialog from './dialogs/ColorPickerDialog.vue'
import QuickSwitcher from './QuickSwitcher.vue'
import TaskDetailPanel from './TaskDetailPanel.vue'
<template>
  <div class="app-container">
    <!-- Кнопка переключения темы -->
    <div class="theme-toggle">
      <el-button 
        :icon="isDarkTheme ? 'Sunny' : 'Moon'" 
        circle 
        @click="toggleTheme"
        class="theme-btn"
        :type="isDarkTheme ? 'warning' : 'primary'"
      />
    </div>

    <!-- Сайдбар -->
    <div class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo" v-if="!isSidebarCollapsed">
          <span>🚀 Kanban Pro</span>
        </div>
        <el-button 
          :icon="isSidebarCollapsed ? Expand : Fold" 
          @click="toggleSidebar"
          class="collapse-btn"
          text
          circle
        />
      </div>

      <!-- Меню пользователя в сайдбаре -->
      <div class="user-section">
        <div class="user-info">
          <el-avatar :size="32" :src="currentUser.avatar" />
          <div class="user-details" v-if="!isSidebarCollapsed">
            <span class="user-name">{{ currentUser.name }}</span>
            <span class="user-role">{{ currentUser.role }}</span>
          </div>
        </div>
      </div>

      <div class="sidebar-content">
        <!-- Навигация -->
        <div class="sidebar-nav">
          <div 
            class="nav-item" 
            :class="{ active: activeNav === 'projects' }"
            @click="activeNav = 'projects'"
          >
            <el-icon><Folder /></el-icon>
            <span v-if="!isSidebarCollapsed">Проекты</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeNav === 'team' }"
            @click="activeNav = 'team'"
          >
            <el-icon><User /></el-icon>
            <span v-if="!isSidebarCollapsed">Команда</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeNav === 'analytics' }"
            @click="activeNav = 'analytics'"
          >
            <el-icon><DataAnalysis /></el-icon>
            <span v-if="!isSidebarCollapsed">Аналитика</span>
          </div>
        </div>

        <!-- Контент в зависимости от выбранной навигации -->
        <div class="sidebar-panel">
          <!-- Панель проектов -->
          <div v-if="activeNav === 'projects'" class="projects-section">
            <div class="section-header" v-if="!isSidebarCollapsed">
              <span>Проекты</span>
              <el-dropdown @command="handleProjectTemplate">
                <el-button 
                  type="primary" 
                  :icon="Plus" 
                  size="small" 
                  circle 
                />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="custom">Произвольный проект</el-dropdown-item>
                    <el-dropdown-item divided command="software">Разработка ПО</el-dropdown-item>
                    <el-dropdown-item command="marketing">Маркетинг кампания</el-dropdown-item>
                    <el-dropdown-item command="simple">Простой проект</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
                @click="openAddProjectDialog('custom')"
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

          <!-- Панель команды -->
          <div v-if="activeNav === 'team'" class="team-section">
            <div class="section-header" v-if="!isSidebarCollapsed">
              <span>Команда</span>
              <el-button 
                type="primary" 
                :icon="Plus" 
                size="small" 
                circle 
                @click="openAddTeamMemberDialog"
              />
            </div>

            <div class="team-list">
              <div
                v-for="member in teamMembers"
                :key="member.id"
                class="team-member"
              >
                <div class="member-avatar">
                  <el-avatar :size="32" :src="member.avatar" />
                  <div class="online-indicator" :class="{ online: member.isOnline }"></div>
                </div>
                <div class="member-info" v-if="!isSidebarCollapsed">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-role">{{ member.role }}</span>
                  <div class="member-projects">
                    <span v-for="projectId in member.projects" :key="projectId" class="project-tag">
                      {{ getProjectName(projectId) }}
                    </span>
                  </div>
                </div>
                <div class="member-actions" v-if="!isSidebarCollapsed">
                  <el-button
                    type="primary"
                    :icon="Edit"
                    size="small"
                    text
                    circle
                    @click.stop="openEditTeamMemberDialog(member)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Панель аналитики -->
          <div v-if="activeNav === 'analytics'" class="analytics-section">
            <div class="section-header" v-if="!isSidebarCollapsed">
              <span>Аналитика</span>
            </div>
            <div class="analytics-content" v-if="!isSidebarCollapsed && currentProject">
              <div class="analytics-item">
                <span class="label">Всего задач</span>
                <span class="value">{{ totalTasksCount }}</span>
              </div>
              <div class="analytics-item">
                <span class="label">Выполнено</span>
                <span class="value">{{ completedTasksCount }}</span>
              </div>
              <div class="analytics-item">
                <span class="label">Прогресс</span>
                <el-progress 
                  :percentage="completionRate" 
                  :color="completionColor"
                  :show-text="false"
                />
                <span class="value">{{ completionRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- Хедер проекта -->
      <div class="project-header">
        <div class="project-title-section">
          <!-- Название проекта - редактируемое по клику -->
          <div 
            v-if="currentProject && !projectTitleEditing"
            class="project-title-display"
            @click="startEditingProjectTitle"
          >
            <h1 class="project-title">{{ currentProject.name }}</h1>
            <el-icon><Edit /></el-icon>
          </div>
          <el-input
            v-else-if="currentProject"
            v-model="currentProject.name"
            class="project-title-input"
            placeholder="Название проекта"
            @blur="finishEditingProjectTitle"
            @keyup.enter="finishEditingProjectTitle"
            ref="projectTitleInput"
            autofocus
          />
          
          <!-- Описание проекта - редактируемое по клику -->
          <div 
            v-if="currentProject && !projectDescriptionEditing"
            class="project-description-display"
            @click="startEditingProjectDescription"
          >
            <p class="project-description">{{ currentProject.description || 'Добавить описание проекта...' }}</p>
            <el-icon><Edit /></el-icon>
          </div>
          <el-input
            v-else-if="currentProject"
            v-model="currentProject.description"
            class="project-description-input"
            placeholder="Добавить описание проекта..."
            type="textarea"
            :rows="2"
            @blur="finishEditingProjectDescription"
            @keyup.enter="finishEditingProjectDescription"
            ref="projectDescriptionInput"
            autofocus
          />
          
          <div v-else class="project-placeholder">
            <h1>Выберите проект</h1>
          </div>
        </div>

        <!-- Кнопки управления проектом -->
        <div class="project-actions" v-if="currentProject">
          <el-button 
            type="primary" 
            :icon="Plus"
            @click="openAddTaskDialog()"
          >
            Добавить задачу
          </el-button>
          <el-button 
            :icon="Setting"
            @click="openProjectSettings"
          >
            Настройки
          </el-button>
          <el-button 
            :icon="Download"
            @click="exportProject"
          >
            Экспорт
          </el-button>
        </div>
      </div>

      <!-- Расширенная фильтрация -->
      <div class="advanced-filters" v-if="currentProject">
        <div class="filters-row">
          <el-input
            v-model="searchQuery"
            placeholder="Поиск по задачам..."
            :prefix-icon="Search"
            style="width: 200px;"
            @input="handleSearch"
          />
          <el-select v-model="statusFilter" placeholder="Статус" clearable @change="applyFilters">
            <el-option label="Бэклог" value="todo" />
            <el-option label="В работе" value="inProgress" />
            <el-option label="Ревью" value="review" />
            <el-option label="Готово" value="done" />
          </el-select>
          <el-select v-model="priorityFilter" placeholder="Приоритет" clearable @change="applyFilters">
            <el-option label="Критичный" value="Критичный" />
            <el-option label="Высокий" value="Высокий" />
            <el-option label="Средний" value="Средний" />
            <el-option label="Низкий" value="Низкий" />
          </el-select>
          <el-select v-model="assigneeFilter" placeholder="Исполнитель" clearable @change="applyFilters">
            <el-option 
              v-for="member in teamMembers"
              :key="member.id"
              :label="member.name"
              :value="member.id"
            />
          </el-select>
          <el-select v-model="tagFilter" multiple placeholder="Теги" clearable @change="applyFilters">
            <el-option 
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
          <el-date-picker
            v-model="dateRangeFilter"
            type="daterange"
            range-separator="до"
            start-placeholder="Начало"
            end-placeholder="Конец"
            value-format="YYYY-MM-DD"
            @change="applyFilters"
          />
          <el-button @click="resetFilters">Сбросить</el-button>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
          <el-button-group>
            <el-button 
              :type="activeView === 'board' ? 'primary' : ''"
              @click="activeView = 'board'"
            >
              Доска
            </el-button>
            <el-button 
              :type="activeView === 'table' ? 'primary' : ''"
              @click="activeView = 'table'"
            >
              Таблица
            </el-button>
            <el-button 
              :type="activeView === 'gantt' ? 'primary' : ''"
              @click="activeView = 'gantt'"
            >
              График
            </el-button>
            <el-button 
              :type="activeView === 'analytics' ? 'primary' : ''"
              @click="activeView = 'analytics'"
            >
              Аналитика
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- Вкладки представлений -->
      <div class="view-tabs">
        <component 
          :is="currentViewComponent" 
          :projects="projects"
          :current-project="currentProject"
          :current-user="currentUser"
          @update-task="updateTask"
          @delete-task="deleteTaskFromTable"
          @open-task="openTaskDetails"
        />
      </div>
    </div>

    <!-- Боковая панель деталей задачи -->
    <el-drawer
      v-model="detailDrawerVisible"
      direction="rtl"
      size="40%"
      class="task-detail-drawer"
      :with-header="false"
    >
      <TaskDetailPanel
        v-if="currentTask"
        :task="currentTask"
        :current-user="currentUser"
        :team-members="teamMembers"
        :available-tags="availableTags"
        @update-task="updateTaskDetail"
        @close="closeTaskDetails"
        @toggle-timer="toggleTimer"
        @reset-timer="resetTimer"
        @add-subtask="addSubtask"
        @update-subtask="updateSubtask"
        @remove-subtask="removeSubtask"
        @add-checklist="addChecklistItem"
        @update-checklist="updateChecklistItem"
        @remove-checklist="removeChecklistItem"
        @add-comment="addComment"
      />
    </el-drawer>

    <!-- Диалоги -->
    <ProjectDialog
      v-model="projectDialogVisible"
      :project="editingProject"
      :template="selectedTemplate"
      @save="saveProject"
    />

    <TeamMemberDialog
      v-model="teamMemberDialogVisible"
      :member="editingTeamMember"
      :projects="projects"
      @save="saveTeamMember"
    />

    <TaskDialog
      v-model="addTaskDialogVisible"
      :task="editingTask"
      :team-members="teamMembers"
      :available-tags="availableTags"
      :column-id="currentColumnId"
      @save="saveTask"
    />

    <ColorPickerDialog
      v-model="colorPickerVisible"
      :current-color="columnForColor?.color"
      @select="selectColor"
    />

    <!-- Quick Switcher -->
    <QuickSwitcher
      v-model="quickSwitcherVisible"
      :projects="projects"
      :tasks="allTasks"
      @select-project="selectProject"
      @select-task="openTaskDetails"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import { 
  Plus, Delete, Clock, Edit, Fold, Expand, Folder, 
  More, Brush, Close, Calendar, User, VideoPlay, VideoPause, RefreshRight,
  Setting, Download, DataAnalysis, Search, Sunny, Moon
} from '@element-plus/icons-vue'
import { useProjectsStore } from '../stores/projects'
import { useTheme } from '../composables/useTheme'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useFilters } from '../composables/useFilters'
import { useOfflineSync } from '../composables/useOfflineSync'
import { TAGS, PROJECT_TEMPLATES, availableColors } from '../utils/constants'
import { debounceFn, exportToJSON } from '../utils/helpers'

// Components
import TableView from './TableView.vue'
import KanbanView from './KanbanView.vue'
import MyTasksView from './MyTasksView.vue'
import GanttView from './GanttView.vue'
import AssigneeView from './AssigneeView.vue'
import AnalyticsView from './AnalyticsView.vue'
import TaskDetailPanel from './TaskDetailPanel.vue'
import ProjectDialog from './dialogs/ProjectDialog.vue'
import TeamMemberDialog from './dialogs/TeamMemberDialog.vue'
import TaskDialog from './dialogs/TaskDialog.vue'
import ColorPickerDialog from './dialogs/ColorPickerDialog.vue'
import QuickSwitcher from './QuickSwitcher.vue'

// Хранилище
const store = useProjectsStore()

// Композаблы
const { isDarkTheme, toggleTheme } = useTheme()
const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts()
const { isOnline, pendingActions, syncPendingActions } = useOfflineSync()

// Состояние интерфейса
const isSidebarCollapsed = ref(false)
const activeView = ref('kanban')
const activeNav = ref('projects')
const detailDrawerVisible = ref(false)
const projectTitleEditing = ref(false)
const projectDescriptionEditing = ref(false)
const quickSwitcherVisible = ref(false)

// Диалоги
const projectDialogVisible = ref(false)
const teamMemberDialogVisible = ref(false)
const addTaskDialogVisible = ref(false)
const colorPickerVisible = ref(false)

// Временные данные
const editingProject = ref(null)
const editingTeamMember = ref(null)
const editingTask = ref(null)
const currentColumnId = ref('')
const currentTask = ref(null)
const columnForColor = ref(null)
const selectedTemplate = ref('custom')

// Фильтры
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const assigneeFilter = ref('')
const tagFilter = ref([])
const dateRangeFilter = ref([])

// Computed
const projects = computed(() => store.projects)
const currentProject = computed(() => store.currentProject)
const currentUser = computed(() => store.currentUser)
const teamMembers = computed(() => store.teamMembers)
const availableTags = ref(TAGS)

const allTasks = computed(() => {
  if (!currentProject.value) return []
  return currentProject.value.columns.flatMap(column => column.tasks)
})

const totalTasksCount = computed(() => allTasks.value.length)

const completedTasksCount = computed(() => {
  if (!currentProject.value) return 0
  const doneColumn = currentProject.value.columns.find(col => col.id === 'done')
  return doneColumn ? doneColumn.tasks.length : 0
})

const completionRate = computed(() => {
  if (totalTasksCount.value === 0) return 0
  return Math.round((completedTasksCount.value / totalTasksCount.value) * 100)
})

const completionColor = computed(() => {
  if (completionRate.value >= 80) return '#67C23A'
  if (completionRate.value >= 50) return '#E6A23C'
  return '#F56C6C'
})

const currentViewComponent = computed(() => {
  const components = {
    table: markRaw(TableView),
    kanban: markRaw(KanbanView),
    myTasks: markRaw(MyTasksView),
    gantt: markRaw(GanttView),
    assignee: markRaw(AssigneeView),
    analytics: markRaw(AnalyticsView)
  }
  return components[activeView.value] || markRaw(KanbanView)
})

// Methods
function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function selectProject(project) {
  store.setCurrentProject(project)
}

function handleProjectTemplate(command) {
  openAddProjectDialog(command)
}

function openAddProjectDialog(template = 'custom') {
  selectedTemplate.value = template
  projectForm.value = { 
    name: '', 
    description: '', 
    template 
  }
  editingProject.value = null
  projectDialogVisible.value = true
}

function saveProject(projectData) {
  store.addProject(projectData)
  projectDialogVisible.value = false
}

function openAddTeamMemberDialog() {
  editingTeamMember.value = null
  teamMemberDialogVisible.value = true
}

function openEditTeamMemberDialog(member) {
  editingTeamMember.value = member
  teamMemberDialogVisible.value = true
}

function saveTeamMember(memberData) {
  // В реальном приложении здесь бы был вызов к API
  if (editingTeamMember.value) {
    Object.assign(editingTeamMember.value, memberData)
  } else {
    const newMember = {
      id: Date.now(),
      ...memberData,
      isOnline: Math.random() > 0.5 // Для демонстрации
    }
    store.teamMembers.push(newMember)
  }
  teamMemberDialogVisible.value = false
}

function getProjectName(projectId) {
  const project = store.projects.find(p => p.id === projectId)
  return project ? project.name : 'Неизвестный проект'
}

function getProjectStats(project) {
  const totalTasks = project.columns.reduce((sum, column) => sum + column.tasks.length, 0)
  return `${totalTasks} задач`
}

function startEditingProjectTitle() {
  projectTitleEditing.value = true
  nextTick(() => {
    projectTitleInput.value?.focus()
  })
}

function finishEditingProjectTitle() {
  projectTitleEditing.value = false
  if (currentProject.value) {
    store.updateProject(currentProject.value.id, { name: currentProject.value.name })
  }
}

function startEditingProjectDescription() {
  projectDescriptionEditing.value = true
  nextTick(() => {
    projectDescriptionInput.value?.focus()
  })
}

function finishEditingProjectDescription() {
  projectDescriptionEditing.value = false
  if (currentProject.value) {
    store.updateProject(currentProject.value.id, { description: currentProject.value.description })
  }
}

function openAddTaskDialog(columnId = '') {
  currentColumnId.value = columnId
  editingTask.value = null
  addTaskDialogVisible.value = true
}

function saveTask(taskData) {
  if (editingTask.value) {
    store.updateTask(currentProject.value.id, editingTask.value.id, taskData)
  } else {
    const columnId = currentColumnId.value || 'todo'
    store.addTaskToColumn(currentProject.value.id, columnId, taskData)
  }
  addTaskDialogVisible.value = false
}

function openTaskDetails(task) {
  currentTask.value = { ...task }
  detailDrawerVisible.value = true
}

function closeTaskDetails() {
  detailDrawerVisible.value = false
  currentTask.value = null
}

function updateTaskDetail(updatedTask) {
  currentTask.value = updatedTask
  if (currentProject.value) {
    store.updateTask(currentProject.value.id, updatedTask.id, updatedTask)
  }
}

function editTask(task) {
  editingTask.value = task
  addTaskDialogVisible.value = true
}

function updateTask(task) {
  if (currentProject.value) {
    store.updateTask(currentProject.value.id, task.id, task)
  }
}

function deleteTaskFromTable(taskId) {
  if (currentProject.value) {
    store.deleteTask(currentProject.value.id, taskId)
  }
}

function openColorPicker(column) {
  columnForColor.value = column
  colorPickerVisible.value = true
}

function selectColor(color) {
  if (columnForColor.value) {
    columnForColor.value.color = color
    if (currentProject.value) {
      store.updateProject(currentProject.value.id, { columns: currentProject.value.columns })
    }
  }
  colorPickerVisible.value = false
}

// Фильтрация
const handleSearch = debounceFn(() => {
  applyFilters()
}, 300)

function applyFilters() {
  // Фильтрация применяется в отдельных компонентах через props
  console.log('Filters applied:', {
    searchQuery: searchQuery.value,
    statusFilter: statusFilter.value,
    priorityFilter: priorityFilter.value,
    assigneeFilter: assigneeFilter.value,
    tagFilter: tagFilter.value,
    dateRangeFilter: dateRangeFilter.value
  })
}

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
  priorityFilter.value = ''
  assigneeFilter.value = ''
  tagFilter.value = []
  dateRangeFilter.value = []
}

// Таймер
function toggleTimer() {
  if (!currentTask.value) return
  currentTask.value.timerRunning = !currentTask.value.timerRunning
  updateTaskDetail(currentTask.value)
}

function resetTimer() {
  if (currentTask.value) {
    currentTask.value.timeTracked = { hours: 0, minutes: 0, seconds: 0 }
    currentTask.value.timerRunning = false
    updateTaskDetail(currentTask.value)
  }
}

// Подзадачи
function addSubtask() {
  if (!currentTask.value) return
  if (!currentTask.value.subtasks) {
    currentTask.value.subtasks = []
  }
  currentTask.value.subtasks.push({
    id: Date.now(),
    title: 'Новая подзадача',
    completed: false
  })
  updateTaskDetail(currentTask.value)
}

function updateSubtask(subtask) {
  updateTaskDetail(currentTask.value)
}

function removeSubtask(index) {
  if (currentTask.value?.subtasks) {
    currentTask.value.subtasks.splice(index, 1)
    updateTaskDetail(currentTask.value)
  }
}

// Чек-лист
function addChecklistItem() {
  if (!currentTask.value) return
  if (!currentTask.value.checklist) {
    currentTask.value.checklist = []
  }
  currentTask.value.checklist.push({
    id: Date.now(),
    text: 'Новый пункт',
    completed: false
  })
  updateTaskDetail(currentTask.value)
}

function updateChecklistItem(item) {
  updateTaskDetail(currentTask.value)
}

function removeChecklistItem(index) {
  if (currentTask.value?.checklist) {
    currentTask.value.checklist.splice(index, 1)
    updateTaskDetail(currentTask.value)
  }
}

// Комментарии
function addComment(commentContent) {
  if (!currentTask.value) return
  if (!currentTask.value.comments) {
    currentTask.value.comments = []
  }
  currentTask.value.comments.push({
    id: Date.now(),
    content: commentContent,
    author: currentUser.value,
    createdAt: new Date().toISOString()
  })
  updateTaskDetail(currentTask.value)
}

// Экспорт
function exportProject() {
  if (currentProject.value) {
    exportToJSON(currentProject.value, `project-${currentProject.value.name}-${new Date().toISOString().split('T')[0]}.json`)
  }
}

function openProjectSettings() {
  // Открытие настроек проекта
  console.log('Open project settings')
}

// Горячие клавиши
onMounted(() => {
  registerShortcut('ctrl+k', () => {
    quickSwitcherVisible.value = true
  })
  registerShortcut('ctrl+n', () => openAddTaskDialog())
  registerShortcut('ctrl+shift+n', () => openAddProjectDialog())
  registerShortcut('escape', () => {
    if (detailDrawerVisible.value) closeTaskDetails()
    if (quickSwitcherVisible.value) quickSwitcherVisible.value = false
  })
})

onUnmounted(() => {
  unregisterShortcut('ctrl+k')
  unregisterShortcut('ctrl+n')
  unregisterShortcut('ctrl+shift+n')
  unregisterShortcut('escape')
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background-color: var(--bg-primary);
  position: relative;
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.theme-btn {
  box-shadow: var(--shadow-md);
}

/* Стили сайдбара и основного контента остаются аналогичными предыдущей версии */
/* Добавляем новые стили для улучшенного UI */

.advanced-filters {
  padding: 16px 32px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.filters-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.quick-actions {
  display: flex;
  justify-content: center;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: var(--danger);
  border: 2px solid white;
  border-radius: 50%;
}

.online-indicator.online {
  background: var(--success);
}

/* Адаптивность */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters-row .el-input,
  .filters-row .el-select,
  .filters-row .el-date-picker {
    width: 100% !important;
  }
  
  .theme-toggle {
    top: 10px;
    right: 10px;
  }
}
</style>