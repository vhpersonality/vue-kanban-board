<template>
  <div class="gantt-view">
    <div class="view-container" v-if="currentProject">
      <div class="gantt-header">
        <h3>График проекта: {{ currentProject.name }}</h3>
        <el-button type="primary" :icon="Download">
          Экспорт
        </el-button>
      </div>
      
      <div class="gantt-chart">
        <div class="gantt-timeline">
          <div class="timeline-header">
            <div class="task-column">Задача</div>
            <div class="timeline-column">График</div>
          </div>
          
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
import { computed } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { formatDate, isOverdue } from '../utils/dateUtils'

const props = defineProps({
  projects: Array,
  currentProject: Object
})

const allTasks = computed(() => {
  if (!props.currentProject) return []
  return props.currentProject.columns.flatMap(column => 
    column.tasks.map(task => ({
      ...task,
      status: column.title,
      // Для демо - генерируем даты начала и окончания
      startDate: task.createdAt,
      duration: calculateTaskDuration(task)
    }))
  )
})

function calculateTaskDuration(task) {
  if (!task.deadline || !task.createdAt) return 7
  
  const start = new Date(task.createdAt)
  const end = new Date(task.deadline)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.min(diffDays, 30)) // Ограничим для демо
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
  // Упрощенная логика для демо
  const startOffset = 10 // Начальная позиция
  const duration = task.duration || 7
  const width = duration * 20 // 20px за день
  
  return {
    left: `${startOffset}%`,
    width: `${width}px`
  }
}

function getTaskTooltip(task) {
  return `
Задача: ${task.title}
Статус: ${getStatusName(task.columnId)}
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

.gantt-chart {
  flex: 1;
  overflow: auto;
}

.gantt-timeline {
  min-width: 800px;
}

.timeline-header {
  display: flex;
  background: #f5f7fa;
  border: 1px solid #e0e0e0;
  font-weight: 600;
  color: #303133;
}

.task-column {
  width: 300px;
  padding: 12px 16px;
  border-right: 1px solid #e0e0e0;
}

.timeline-column {
  flex: 1;
  padding: 12px 16px;
}

.gantt-row {
  display: flex;
  border: 1px solid #e0e0e0;
  border-top: none;
  min-height: 60px;
}

.task-info {
  width: 300px;
  padding: 12px 16px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.task-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.assignee {
  font-size: 12px;
  color: #909399;
}

.timeline-track {
  flex: 1;
  position: relative;
  padding: 8px;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 19px,
    #f0f0f0 20px
  );
}

.task-bar {
  position: absolute;
  height: 32px;
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
}

.task-bar:hover {
  opacity: 0.8;
  transform: translateY(-1px);
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
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>