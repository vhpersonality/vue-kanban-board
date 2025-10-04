<template>
  <div class="gantt-view">
    <div class="view-container" v-if="currentProject">
      <div class="gantt-header">
        <h3>График проекта: {{ currentProject.name }}</h3>
        <div class="gantt-controls">
          <el-button-group>
            <el-button :icon="ArrowLeft" @click="changeTimeRange(-1)" />
            <el-button>{{ getCurrentTimeRange() }}</el-button>
            <el-button :icon="ArrowRight" @click="changeTimeRange(1)" />
          </el-button-group>
          <el-button type="primary" :icon="Download">
            Экспорт
          </el-button>
        </div>
      </div>
      
      <div class="gantt-chart">
        <div class="gantt-timeline">
          <!-- Заголовок временной шкалы -->
          <div class="timeline-header">
            <div class="task-column">Задача</div>
            <div class="timeline-scale">
              <div 
                v-for="day in timelineDays" 
                :key="day.date"
                class="timeline-day"
                :class="{ 
                  'weekend': day.isWeekend,
                  'today': day.isToday 
                }"
              >
                <div class="day-date">{{ formatDay(day.date) }}</div>
                <div class="day-name">{{ getDayName(day.date) }}</div>
              </div>
            </div>
          </div>
          
          <!-- Задачи -->
          <div 
            v-for="task in allTasks" 
            :key="task.id"
            class="gantt-row"
          >
            <div class="task-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <el-tag size="small" :type="getPriorityType(task.priority)">
                  {{ task.priority }}
                </el-tag>
                <span class="assignee" v-if="task.assignee">
                  {{ task.assignee.name }}
                </span>
              </div>
            </div>
            
            <div class="timeline-track">
              <div 
                class="task-bar"
                :class="getTaskBarClass(task)"
                :style="getTaskBarStyle(task)"
                :title="getTaskTooltip(task)"
              >
                <span class="task-bar-label">{{ task.title }}</span>
                <div class="task-progress" :style="getProgressStyle(task)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <el-empty description="Выберите проект для просмотра графика" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Download, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { formatDate, isOverdue } from '../utils/dateUtils'

const props = defineProps({
  projects: Array,
  currentProject: Object
})

// Управление временным диапазоном
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const allTasks = computed(() => {
  if (!props.currentProject) return []
  return props.currentProject.columns.flatMap(column => 
    column.tasks.map(task => ({
      ...task,
      status: column.title,
      startDate: task.createdAt,
      endDate: task.deadline || getDefaultEndDate(task.createdAt),
      progress: calculateTaskProgress(task)
    }))
  )
})

// Генерация временной шкалы
const timelineDays = computed(() => {
  const days = []
  const startDate = new Date(currentYear.value, currentMonth.value, 1)
  const endDate = new Date(currentYear.value, currentMonth.value + 1, 0)
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    days.push({
      date: new Date(date),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: isToday(date)
    })
  }
  
  return days
})

function getDefaultEndDate(startDate) {
  const date = new Date(startDate)
  date.setDate(date.getDate() + 7) // По умолчанию задача на 7 дней
  return date
}

function calculateTaskProgress(task) {
  if (!task.startDate || !task.endDate) return 0
  
  const start = new Date(task.startDate)
  const end = new Date(task.endDate)
  const now = new Date()
  
  if (now >= end) return 100
  if (now <= start) return 0
  
  const totalDuration = end - start
  const elapsed = now - start
  return Math.min(100, (elapsed / totalDuration) * 100)
}

function getTaskBarClass(task) {
  if (isOverdue(task.deadline)) return 'overdue'
  
  const statusClass = {
    'todo': 'planned',
    'inProgress': 'in-progress',
    'review': 'review',
    'done': 'completed'
  }
  return statusClass[task.columnId] || 'planned'
}

function getTaskBarStyle(task) {
  if (!task.startDate || !task.endDate) return {}
  
  const start = new Date(task.startDate)
  const end = new Date(task.endDate)
  const monthStart = new Date(currentYear.value, currentMonth.value, 1)
  const monthEnd = new Date(currentYear.value, currentMonth.value + 1, 0)
  
  // Ограничиваем даты рамками месяца
  const visibleStart = start < monthStart ? monthStart : start
  const visibleEnd = end > monthEnd ? monthEnd : end
  
  const startOffset = Math.max(0, (visibleStart - monthStart) / (1000 * 60 * 60 * 24))
  const duration = Math.max(1, (visibleEnd - visibleStart) / (1000 * 60 * 60 * 24) + 1)
  
  return {
    left: `${startOffset * 30}px`,
    width: `${duration * 30}px`
  }
}

function getProgressStyle(task) {
  return {
    width: `${task.progress}%`
  }
}

function getTaskTooltip(task) {
  return `
Задача: ${task.title}
Статус: ${getStatusName(task.columnId)}
Прогресс: ${Math.round(task.progress)}%
Дедлайн: ${formatDate(task.deadline) || 'Не установлен'}
Исполнитель: ${task.assignee?.name || 'Не назначен'}
  `.trim()
}

function getStatusName(columnId) {
  const column = props.currentProject?.columns.find(col => col.id === columnId)
  return column ? column.title : 'Неизвестно'
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

// Форматирование дат
function formatDay(date) {
  return date.getDate()
}

function getDayName(date) {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return days[date.getDay()]
}

function isToday(date) {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function getCurrentTimeRange() {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return `${months[currentMonth.value]} ${currentYear.value}`
}

function changeTimeRange(direction) {
  currentMonth.value += direction
  if (currentMonth.value > 11) {
    currentMonth.value = 0
    currentYear.value++
  } else if (currentMonth.value < 0) {
    currentMonth.value = 11
    currentYear.value--
  }
}
</script>

<style scoped>
.gantt-view {
  height: 100%;
  padding: 20px;
  background: white;
}

.view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.gantt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.gantt-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.gantt-chart {
  flex: 1;
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.gantt-timeline {
  min-width: 1200px;
}

.timeline-header {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  color: #303133;
  position: sticky;
  top: 0;
  z-index: 10;
}

.task-column {
  width: 300px;
  padding: 12px 16px;
  border-right: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.timeline-scale {
  display: flex;
  flex: 1;
}

.timeline-day {
  width: 30px;
  padding: 8px 4px;
  text-align: center;
  border-right: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.timeline-day.weekend {
  background-color: #fef2f2;
}

.timeline-day.today {
  background-color: #dbeafe;
}

.day-date {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.day-name {
  font-size: 10px;
  color: #666;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  min-height: 50px;
}

.task-info {
  width: 300px;
  padding: 8px 16px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
}

.task-title {
  font-weight: 500;
  margin-bottom: 4px;
  font-size: 14px;
}

.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.assignee {
  font-size: 12px;
  color: #909399;
}

.timeline-track {
  flex: 1;
  position: relative;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 29px,
    #f5f5f5 30px
  );
}

.task-bar {
  position: absolute;
  height: 30px;
  background: #409eff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.task-bar:hover {
  opacity: 0.8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.task-bar.planned {
  background: #909399;
}

.task-bar.in-progress {
  background: #e6a23c;
}

.task-bar.review {
  background: #409eff;
}

.task-bar.completed {
  background: #67c23a;
}

.task-bar.overdue {
  background: #f56c6c;
}

.task-bar-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 2;
  position: relative;
}

.task-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  transition: width 0.3s ease;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Адаптивность */
@media (max-width: 768px) {
  .gantt-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .gantt-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>