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
      <!-- Шапка с пользователем -->
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
                    <div 
                      class="column-wrapper"
                      @mouseenter="hoveredColumn = column.id"
                      @mouseleave="hoveredColumn = null"
                    >
                      <div class="column">
                        <div class="column-header">
                          <div class="column-title-section">
                            <!-- Цвет колонки -->
                            <div 
                              class="column-color-indicator"
                              :style="{ backgroundColor: column.color || '#409EFF' }"
                              @click="openColorPicker(column)"
                            ></div>
                            
                            <!-- Название колонки - редактируемое по клику -->
                            <div 
                              v-if="!column.editing"
                              class="column-title-display"
                              @click="startEditingColumn(column)"
                            >
                              <span class="column-title">{{ column.title }}</span>
                              <span class="task-count">({{ column.tasks.length }})</span>
                            </div>
                            
                            <!-- Поле редактирования -->
                            <el-input
                              v-else
                              v-model="column.title"
                              @blur="finishEditingColumn(column)"
                              @keyup.enter="finishEditingColumn(column)"
                              class="column-title-input"
                              size="small"
                              ref="columnInput"
                              autofocus
                            />
                          </div>
                          
                          <!-- Меню колонки (показывается только при наведении) -->
                          <div class="column-menu" v-show="hoveredColumn === column.id">
                            <el-dropdown trigger="click" @command="(command) => handleColumnCommand(command, column)">
                              <el-button
                                :icon="More"
                                size="small"
                                text
                                circle
                              />
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item command="changeColor">
                                    <el-icon><Brush /></el-icon>
                                    Изменить цвет
                                  </el-dropdown-item>
                                  <el-dropdown-item command="addTask">
                                    <el-icon><Plus /></el-icon>
                                    Добавить задачу
                                  </el-dropdown-item>
                                  <el-dropdown-item divided command="deleteColumn" :disabled="currentProject.columns.length <= 1">
                                    <el-icon><Delete /></el-icon>
                                    Удалить колонку
                                  </el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
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
                                <!-- Только название, исполнитель, приоритет и дедлайн -->
                                <div class="task-header">
                                  <p class="task-title">{{ task.title }}</p>
                                </div>
                                
                                <div class="task-meta">
                                  <div class="assignee-info" v-if="task.assignee">
                                    <el-avatar :size="20" :src="task.assignee.avatar" />
                                    <span class="assignee-name">{{ task.assignee.name }}</span>
                                  </div>
                                  
                                  <div class="task-tags">
                                    <el-tag 
                                      size="small" 
                                      :type="getPriorityType(task.priority)"
                                      :effect="isOverdue(task.deadline) ? 'dark' : 'light'"
                                    >
                                      {{ task.priority }}
                                    </el-tag>
                                    
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

                        <!-- Кнопка добавления задачи (тоже показывается при наведении) -->
                        <div class="column-footer" v-show="hoveredColumn === column.id">
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

    <!-- Боковая панель деталей задачи (Notion-style) -->
    <el-drawer
      v-model="detailDrawerVisible"
      direction="rtl"
      size="40%"
      class="task-detail-drawer"
      :with-header="false"
    >
      <div class="task-detail-content" v-if="currentTask">
        <!-- Заголовок -->
        <div class="task-detail-header">
          <el-button 
            :icon="Close" 
            text 
            circle 
            @click="closeTaskDetails"
            class="close-btn"
          />
        </div>

        <div class="task-detail-body">
          <!-- Название задачи -->
          <div class="task-title-section">
            <h1 class="task-main-title">{{ currentTask.title }}</h1>
          </div>

          <!-- Основные свойства -->
          <div class="task-properties">
            <div class="property-group">
              <h3 class="property-group-title">Свойства</h3>
              
              <!-- Статус -->
              <div class="property-item">
                <label class="property-label">Статус</label>
                <div class="property-value">
                  <el-tag :type="getStatusType(currentTask.columnId)" size="large">
                    {{ getColumnTitleById(currentTask.columnId) }}
                  </el-tag>
                </div>
              </div>

              <!-- Исполнитель -->
              <div class="property-item">
                <label class="property-label">Исполнитель</label>
                <div class="property-value">
                  <div v-if="currentTask.assignee" class="user-display">
                    <el-avatar :size="32" :src="currentTask.assignee.avatar" />
                    <div class="user-info">
                      <span class="user-name">{{ currentTask.assignee.name }}</span>
                      <span class="user-role">{{ getAssigneeRole(currentTask.assignee) }}</span>
                    </div>
                  </div>
                  <span v-else class="empty-value">Не назначен</span>
                </div>
              </div>

              <!-- Постановщик -->
              <div class="property-item">
                <label class="property-label">Постановщик</label>
                <div class="property-value">
                  <div class="user-display">
                    <el-avatar :size="32" :src="currentTask.creator?.avatar || currentUser.avatar" />
                    <div class="user-info">
                      <span class="user-name">{{ currentTask.creator?.name || currentUser.name }}</span>
                      <span class="user-role">{{ currentTask.creator?.role || currentUser.role }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Дедлайн -->
              <div class="property-item">
                <label class="property-label">Дедлайн</label>
                <div class="property-value">
                  <div class="deadline-display" :class="{ 'overdue': isOverdue(currentTask.deadline) }">
                    <el-icon><Calendar /></el-icon>
                    <span class="deadline-text">
                      {{ currentTask.deadline ? formatDate(currentTask.deadline) : 'Не установлен' }}
                    </span>
                    <el-tag 
                      v-if="currentTask.deadline" 
                      :type="getTimeRemainingType(currentTask.deadline)" 
                      size="small"
                      class="time-remaining-tag"
                    >
                      {{ getTimeRemainingText(currentTask.deadline) }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <!-- Приоритет -->
              <div class="property-item">
                <label class="property-label">Приоритет</label>
                <div class="property-value">
                  <el-tag 
                    :type="getPriorityType(currentTask.priority)" 
                    size="large"
                    :effect="isOverdue(currentTask.deadline) ? 'dark' : 'light'"
                  >
                    {{ currentTask.priority }}
                  </el-tag>
                </div>
              </div>

              <!-- Даты создания и обновления -->
              <div class="property-item">
                <label class="property-label">Создана</label>
                <div class="property-value date-value">
                  {{ formatDate(currentTask.createdAt) }}
                </div>
              </div>

              <div class="property-item">
                <label class="property-label">Обновлена</label>
                <div class="property-value date-value">
                  {{ formatDate(currentTask.updatedAt) }}
                </div>
              </div>
            </div>

            <!-- Описание задачи -->
            <div class="property-group">
              <h3 class="property-group-title">Описание</h3>
              <div class="task-description-content">
                <p v-if="currentTask.description" class="description-text">
                  {{ currentTask.description }}
                </p>
                <p v-else class="empty-description">
                  Нет описания
                </p>
              </div>
            </div>

            <!-- Трекинг времени -->
            <div class="property-group">
              <h3 class="property-group-title">Трекинг времени</h3>
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

            <!-- Комментарии -->
            <div class="property-group">
              <div class="comments-header">
                <h3 class="property-group-title">Комментарии</h3>
                <span class="comments-count">{{ currentTask.comments?.length || 0 }}</span>
              </div>
              
              <!-- Список комментариев -->
              <div class="comments-list" v-if="currentTask.comments && currentTask.comments.length > 0">
                <div 
                  v-for="comment in currentTask.comments" 
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-header">
                    <el-avatar :size="28" :src="comment.author.avatar" />
                    <div class="comment-author">
                      <span class="author-name">{{ comment.author.name }}</span>
                      <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="comment-content">
                    {{ comment.content }}
                  </div>
                </div>
              </div>
              
              <!-- Пустые комментарии -->
              <div v-else class="empty-comments">
                <p>Пока нет комментариев</p>
              </div>

              <!-- Форма добавления комментария -->
              <div class="add-comment-section">
                <div class="comment-input-wrapper">
                  <el-avatar :size="32" :src="currentUser.avatar" class="current-user-avatar" />
                  <div class="comment-input-container">
                    <el-input
                      v-model="newComment"
                      type="textarea"
                      :rows="3"
                      placeholder="Напишите комментарий..."
                      class="comment-input"
                    />
                    <div class="comment-actions">
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="addComment"
                        :disabled="!newComment.trim()"
                      >
                        Отправить
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Футер с действиями -->
        <div class="task-detail-footer">
          <el-button @click="closeTaskDetails">Закрыть</el-button>
          <el-button type="primary" @click="editTask(currentTask)">
            Редактировать задачу
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- Диалог выбора цвета для колонки -->
    <el-dialog 
      v-model="colorPickerVisible" 
      title="Выберите цвет колонки" 
      width="400"
      center
    >
      <div class="color-picker">
        <div 
          v-for="color in columnColors"
          :key="color"
          class="color-option"
          :style="{ backgroundColor: color }"
          :class="{ active: selectedColumn?.color === color }"
          @click="setColumnColor(color)"
        ></div>
      </div>
      <template #footer>
        <el-button @click="colorPickerVisible = false">Отмена</el-button>
        <el-button type="primary" @click="confirmColumnColor">
          Применить
        </el-button>
      </template>
    </el-dialog>

    <!-- Остальные диалоги (добавление/редактирование задач, проектов) остаются без изменений -->
    <!-- ... -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  Plus, Delete, Clock, Edit, Fold, Expand, Folder, Menu, ArrowDown, 
  More, Brush, Close, Calendar, User 
} from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue } from '../utils/dateUtils'
import draggable from 'vuedraggable'
import TableView from './TableView.vue'
import MyTasksView from './MyTasksView.vue'
import GanttView from './GanttView.vue'

// Текущий пользователь
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
const hoveredColumn = ref(null)
const detailDrawerVisible = ref(false)
const colorPickerVisible = ref(false)

// Цвета для колонок (палитра как в Notion)
const columnColors = ref([
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', 
  '#D97706', '#65A30D', '#059669', '#0D9488', '#0891B2',
  '#2563EB', '#4338CA', '#7DD3FC', '#FDA4AF', '#FDE68A'
])

// Выбранная колонка для изменения цвета
const selectedColumn = ref(null)
const columnInput = ref(null)

// Новый комментарий
const newComment = ref('')

// Команда проекта
const teamMembers = ref([
  { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer' },
  { id: 2, name: 'Мария Петрова', avatar: '', role: 'UI/UX Designer' },
  { id: 3, name: 'Дмитрий Сидоров', avatar: '', role: 'Backend Developer' },
  { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager' }
])

// Состояние проектов (с цветами колонок и комментариями)
const projects = ref([
  {
    id: 1,
    name: 'Разработка продукта',
    description: 'Основной проект по разработке нового продукта',
    columns: [
      {
        id: 'todo',
        title: 'Бэклог',
        color: '#4F46E5',
        editing: false,
        tasks: [
          { 
            id: 1, 
            title: 'Прототип интерфейса', 
            description: 'Создать прототип основного интерфейса в Figma с учетом пользовательского опыта и современных тенденций дизайна. Необходимо предусмотреть адаптивную верстку и доступность.', 
            priority: 'Высокий',
            deadline: '2024-12-31 18:00:00',
            createdAt: '2024-01-15 10:00:00',
            updatedAt: '2024-01-15 10:00:00',
            columnId: 'todo',
            assignee: { id: 2, name: 'Мария Петрова', avatar: '', role: 'UI/UX Designer' },
            creator: { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager' },
            comments: [
              {
                id: 1,
                content: 'Нужно добавить мобильную версию прототипа',
                author: { id: 4, name: 'Елена Козлова', avatar: '' },
                createdAt: '2024-01-15 14:30:00'
              },
              {
                id: 2,
                content: 'Уже работаю над адаптивной версией',
                author: { id: 2, name: 'Мария Петрова', avatar: '' },
                createdAt: '2024-01-15 16:45:00'
              }
            ]
          }
        ]
      },
      {
        id: 'inProgress',
        title: 'В работе',
        color: '#D97706',
        editing: false,
        tasks: [
          { 
            id: 2, 
            title: 'Разработать канбан-доску', 
            description: 'Создать канбан-доску на Vue 3 и Element Plus с drag-and-drop функционалом, responsive design и локальным хранилищем. Реализовать различные представления данных.', 
            priority: 'Высокий',
            deadline: '2024-01-20 23:59:00',
            createdAt: '2024-01-10 14:20:00',
            updatedAt: '2024-01-15 11:30:00',
            columnId: 'inProgress',
            assignee: { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer' },
            creator: { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager' },
            comments: []
          }
        ]
      },
      {
        id: 'review',
        title: 'Ревью',
        color: '#0891B2',
        editing: false,
        tasks: [
          { 
            id: 3, 
            title: 'Тестирование API', 
            description: 'Протестировать endpoints REST API на корректность работы, производительность и безопасность. Проверить обработку ошибок и граничные случаи.', 
            priority: 'Средний',
            deadline: '2024-01-18 17:00:00',
            createdAt: '2024-01-12 13:15:00',
            updatedAt: '2024-01-15 16:45:00',
            columnId: 'review',
            assignee: { id: 3, name: 'Дмитрий Сидоров', avatar: '', role: 'Backend Developer' },
            creator: { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer' },
            comments: [
              {
                id: 3,
                content: 'Нашел несколько проблем с валидацией входных данных',
                author: { id: 3, name: 'Дмитрий Сидоров', avatar: '' },
                createdAt: '2024-01-16 09:20:00'
              }
            ]
          }
        ]
      },
      {
        id: 'done',
        title: 'Готово',
        color: '#059669',
        editing: false,
        tasks: [
          { 
            id: 4, 
            title: 'Настройка проекта', 
            description: 'Инициализировать Vue приложение и настроить базовую структуру проекта с роутингом и состоянием. Настроить инструменты разработки и CI/CD.', 
            priority: 'Низкий',
            deadline: '2024-01-12 17:00:00',
            createdAt: '2024-01-08 13:15:00',
            updatedAt: '2024-01-12 16:45:00',
            columnId: 'done',
            assignee: { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer' },
            creator: { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer' },
            comments: []
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

// Методы для колонок
function startEditingColumn(column) {
  column.editing = true
  nextTick(() => {
    if (columnInput.value) {
      columnInput.value.focus()
    }
  })
}

function finishEditingColumn(column) {
  column.editing = false
  if (!column.title.trim()) {
    column.title = 'Без названия'
  }
  saveToLocalStorage()
}

function openColorPicker(column) {
  selectedColumn.value = column
  colorPickerVisible.value = true
}

function setColumnColor(color) {
  if (selectedColumn.value) {
    selectedColumn.value.color = color
  }
}

function confirmColumnColor() {
  colorPickerVisible.value = false
  saveToLocalStorage()
}

function handleColumnCommand(command, column) {
  switch (command) {
    case 'changeColor':
      openColorPicker(column)
      break
    case 'addTask':
      openAddTaskDialog(column.id)
      break
    case 'deleteColumn':
      openDeleteColumnDialog(column)
      break
  }
}

// Методы для задач
function openTaskDetails(task) {
  currentTask.value = { ...task }
  detailDrawerVisible.value = true
  newComment.value = ''
}

function closeTaskDetails() {
  detailDrawerVisible.value = false
  currentTask.value = null
  newComment.value = ''
}

function addComment() {
  if (!newComment.value.trim() || !currentTask.value) return

  const comment = {
    id: Date.now(),
    content: newComment.value.trim(),
    author: { ...currentUser.value },
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }

  if (!currentTask.value.comments) {
    currentTask.value.comments = []
  }
  
  currentTask.value.comments.push(comment)
  newComment.value = ''
  
  // Обновляем задачу в основном хранилище
  updateTask(currentTask.value)
}

function formatCommentTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays === 1) return 'вчера'
  if (diffDays < 7) return `${diffDays} д. назад`
  
  return formatDate(dateString)
}

function getAssigneeRole(assignee) {
  return teamMembers.value.find(member => member.id === assignee.id)?.role || ''
}

function getStatusType(columnId) {
  const statusTypes = {
    'todo': 'info',
    'inProgress': 'warning',
    'review': 'primary',
    'done': 'success'
  }
  return statusTypes[columnId] || 'info'
}

// Остальные методы остаются без изменений...
// (handleUserCommand, toggleSidebar, selectProject, openAddProjectDialog, saveProject, 
//  addTask, updateTask, deleteTask, editTask, saveTask, и все вспомогательные методы)

// Вспомогательные методы (без изменений)
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
.app-container {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

/* Сайдбар (без изменений) */
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

/* Шапка */
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
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.column:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.column-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.column-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.column-color-indicator:hover {
  transform: scale(1.1);
}

.column-title-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.column-title-display:hover {
  background-color: #f5f7fa;
}

.column-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-count {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  flex-shrink: 0;
}

.column-title-input {
  flex: 1;
}

.column-menu {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.column-wrapper:hover .column-menu {
  opacity: 1;
}

.tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  border-left: 3px solid #409eff;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.task-header {
  margin-bottom: 8px;
}

.task-title {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.task-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.deadline-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.column-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.column-wrapper:hover .column-footer {
  opacity: 1;
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
  border-radius: 12px;
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

/* Боковая панель деталей задачи */
.task-detail-drawer :deep(.el-drawer) {
  border-radius: 12px 0 0 12px;
}

.task-detail-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.task-detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.task-detail-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  color: #909399;
}

.task-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.task-title-section {
  margin-bottom: 32px;
  padding-top: 16px;
}

.task-main-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
}

.task-properties {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.property-group-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.property-item {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.property-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  width: 120px;
  flex-shrink: 0;
  line-height: 32px;
}

.property-value {
  flex: 1;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.user-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.user-role {
  font-size: 12px;
  color: #9ca3af;
}

.empty-value {
  color: #9ca3af;
  font-style: italic;
}

.deadline-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.deadline-display.overdue {
  background: #fef2f2;
  border-color: #fecaca;
}

.deadline-text {
  font-weight: 500;
}

.time-remaining-tag {
  margin-left: auto;
}

.date-value {
  color: #6b7280;
  font-size: 14px;
}

.task-description-content {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.description-text {
  margin: 0;
  line-height: 1.6;
  color: #4b5563;
  white-space: pre-wrap;
}

.empty-description {
  margin: 0;
  color: #9ca3af;
  font-style: italic;
}

.time-tracking {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.time-label {
  font-weight: 500;
  color: #6b7280;
}

.time-value {
  color: #3b82f6;
  font-weight: 600;
}

/* Комментарии */
.comments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.comments-count {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.comment-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-author {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #9ca3af;
}

.comment-content {
  color: #4b5563;
  line-height: 1.5;
  white-space: pre-wrap;
}

.empty-comments {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
}

.add-comment-section {
  margin-top: 16px;
}

.comment-input-wrapper {
  display: flex;
  gap: 12px;
}

.current-user-avatar {
  flex-shrink: 0;
}

.comment-input-container {
  flex: 1;
}

.comment-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  resize: none;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.task-detail-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Выбор цвета */
.color-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 16px 0;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 3px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #3b82f6;
  transform: scale(1.1);
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
  
  .task-detail-drawer :deep(.el-drawer) {
    width: 50% !important;
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
  
  .top-header {
    padding: 12px 16px;
  }
  
  .user-name {
    display: none;
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
  
  .task-detail-drawer :deep(.el-drawer) {
    width: 90% !important;
  }
  
  .property-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .property-label {
    width: auto;
  }
  
  .time-tracking {
    grid-template-columns: 1fr;
  }
  
  .color-picker {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>