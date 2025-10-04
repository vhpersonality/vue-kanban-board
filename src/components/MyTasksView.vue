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
              {{ task.description }}
            </p>
            
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
import { Edit, Clock, Timer } from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue } from '../utils/dateUtils'

const props = defineProps({
  projects: Array,
  currentUser: Object
})

const emit = defineEmits(['update-task', 'open-task'])

const filterStatus = ref('all')

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
  switch (filterStatus.value) {
    case 'todo':
      return myTasks.value.filter(task => task.columnId === 'todo')
    case 'inProgress':
      return myTasks.value.filter(task => task.columnId === 'inProgress')
    case 'review':
      return myTasks.value.filter(task => task.columnId === 'review')
    case 'done':
      return myTasks.value.filter(task => task.columnId === 'done')
    case 'overdue':
      return overdueTasks.value
    default:
      return myTasks.value
  }
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
</script>

<style scoped>
.my-tasks-view {
  height: 100%;
  padding: 20px;
  background: white;
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
  border-bottom: 1px solid #e0e0e0;
}

.my-tasks-header h2 {
  margin: 0;
  color: #303133;
}

.tasks-stats {
  display: flex;
  gap: 20px;
}

.tasks-filter {
  margin-bottom: 20px;
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
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
  background: white;
}

.task-main {
  flex: 1;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.task-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  margin-right: 12px;
}

.task-meta {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.task-description {
  margin: 8px 0;
  color: #606266;
  line-height: 1.5;
  font-size: 14px;
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
  color: #909399;
}

.date-info.overdue {
  color: #f56c6c;
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