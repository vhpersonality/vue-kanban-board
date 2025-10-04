<template>
  <div class="my-tasks-view">
    <div class="view-container" v-if="currentUser">
      <div class="my-tasks-header">
        <h2>Мои задачи</h2>
        <div class="tasks-stats">
          <el-statistic title="Всего задач" :value="myTasks.length" />
          <el-statistic title="В работе" :value="inProgressTasks.length" />
          <el-statistic title="Просрочено" :value="overdueTasks.length" />
        </div>
      </div>

      <div class="tasks-filter">
        <el-radio-group v-model="filterStatus" size="small">
          <el-radio-button label="all">Все</el-radio-button>
          <el-radio-button label="todo">Бэклог</el-radio-button>
          <el-radio-button label="inProgress">В работе</el-radio-button>
          <el-radio-button label="review">Ревью</el-radio-button>
          <el-radio-button label="done">Готово</el-radio-button>
          <el-radio-button label="overdue">Просрочено</el-radio-button>
        </el-radio-group>

        <el-input
          v-model="searchQuery"
          placeholder="Поиск по задачам..."
          :prefix-icon="Search"
          style="width: 200px;"
          clearable
        />
      </div>

      <div class="tasks-list">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-item"
          @click="$emit('open-task', task)"
        >
          <div class="task-main">
            <div class="task-header">
              <h4 class="task-title">{{ task.title }}</h4>
              <div class="task-meta">
                <el-tag 
                  size="small" 
                  :type="getPriorityType(task.priority)"
                >
                  {{ task.priority }}
                </el-tag>
                <el-tag 
                  size="small" 
                  :type="getStatusType(task.columnId)"
                >
                  {{ getProjectName(task) }} • {{ getStatusName(task.columnId) }}
                </el-tag>
              </div>
            </div>
            
            <p class="task-description" v-if="task.description">
              {{ truncateDescription(task.description) }}
            </p>

            <!-- Теги задачи -->
            <div class="task-tags" v-if="task.tags && task.tags.length">
              <el-tag
                v-for="tag in task.tags"
                :key="tag"
                size="mini"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
            
            <div class="task-footer">
              <div class="task-dates">
                <div class="date-info">
                  <el-icon><Clock /></el-icon>
                  <span>Создана: {{ formatDate(task.createdAt) }}</span>
                </div>
                <div 
                  v-if="task.deadline" 
                  class="date-info"
                  :class="{ 'overdue': isOverdue(task.deadline) }"
                >
                  <el-icon><Timer /></el-icon>
                  <span>Дедлайн: {{ formatDate(task.deadline) }}</span>
                </div>
              </div>
              
              <div class="time-remaining" v-if="task.deadline && !isOverdue(task.deadline)">
                <el-tag :type="getTimeRemainingType(task.deadline)" size="small">
                  {{ getTimeRemainingText(task.deadline) }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <div class="task-actions">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              circle
              @click.stop="$emit('update-task', task)"
            />
          </div>
        </div>
      </div>

      <div v-if="filteredTasks.length === 0" class="empty-tasks">
        <el-empty description="Нет задач по выбранному фильтру" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Edit, Clock, Timer, Search } from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue } from '../utils/dateUtils'

const props = defineProps({
  projects: Array,
  currentUser: Object
})

const emit = defineEmits(['update-task', 'open-task'])

const filterStatus = ref('all')
const searchQuery = ref('')

// Все задачи текущего пользователя
const myTasks = computed(() => {
  if (!props.currentUser || !props.projects) return []
  
  return props.projects.flatMap(project => 
    project.columns.flatMap(column => 
      column.tasks
        .filter(task => task.assignee?.id === props.currentUser.id)
        .map(task => ({
          ...task,
          projectId: project.id,
          projectName: project.name
        }))
    )
  )
})

// Задачи в работе
const inProgressTasks = computed(() => 
  myTasks.value.filter(task => task.columnId === 'inProgress')
)

// Просроченные задачи
const overdueTasks = computed(() => 
  myTasks.value.filter(task => task.deadline && isOverdue(task.deadline))
)

// Отфильтрованные задачи
const filteredTasks = computed(() => {
  let tasks = myTasks.value

  // Фильтр по статусу
  switch (filterStatus.value) {
    case 'todo':
      tasks = tasks.filter(task => task.columnId === 'todo')
      break
    case 'inProgress':
      tasks = tasks.filter(task => task.columnId === 'inProgress')
      break
    case 'review':
      tasks = tasks.filter(task => task.columnId === 'review')
      break
    case 'done':
      tasks = tasks.filter(task => task.columnId === 'done')
      break
    case 'overdue':
      tasks = overdueTasks.value
      break
    default:
      // все задачи
      break
  }

  // Поиск по тексту
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tasks = tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    )
  }

  return tasks
})

function getProjectName(task) {
  return task.projectName || 'Неизвестный проект'
}

function getStatusName(columnId) {
  const statusNames = {
    'todo': 'Бэклог',
    'inProgress': 'В работе',
    'review': 'Ревью',
    'done': 'Готово'
  }
  return statusNames[columnId] || 'Неизвестно'
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

function truncateDescription(description) {
  if (!description) return ''
  return description.length > 150 ? description.substring(0, 150) + '...' : description
}
</script>

<style scoped>
.my-tasks-view {
  height: 100%;
  padding: 20px;
  background: var(--bg-primary);
}

.view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.my-tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.my-tasks-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.tasks-stats {
  display: flex;
  gap: 20px;
}

.tasks-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.tasks-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-secondary);
}

.task-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  background: var(--bg-primary);
}

.task-main {
  flex: 1;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  margin-right: 12px;
}

.task-meta {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.task-description {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
  line-height: 1.4;
}

.task-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.task-dates {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.date-info.overdue {
  color: var(--danger);
  font-weight: 500;
}

.time-remaining {
  margin-left: 12px;
}

.task-actions {
  margin-left: 12px;
}

.empty-tasks {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Адаптивность */
@media (max-width: 768px) {
  .my-tasks-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .tasks-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .tasks-filter {
    flex-direction: column;
    align-items: stretch;
  }
  
  .task-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .task-meta {
    width: 100%;
    justify-content: flex-start;
  }
  
  .task-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>