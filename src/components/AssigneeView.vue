<template>
  <div class="assignee-view">
    <div class="view-container" v-if="currentProject">
      <div class="assignee-columns">
        <div 
          v-for="member in teamMembers" 
          :key="member.id"
          class="assignee-column"
        >
          <div class="column-header">
            <div class="assignee-info">
              <el-avatar :size="32" :src="member.avatar" />
              <div class="assignee-details">
                <div class="assignee-name">{{ member.name }}</div>
                <div class="assignee-role">{{ member.role }}</div>
              </div>
            </div>
            <el-tag type="info" size="small">
              {{ getAssigneeTaskCount(member) }} задач
            </el-tag>
          </div>
          
          <div class="tasks-list">
            <div
              v-for="task in getAssigneeTasks(member)"
              :key="task.id"
              class="task-card"
              @click="$emit('update-task', task)"
            >
              <div class="task-content">
                <div class="task-header">
                  <p class="task-title">{{ task.title }}</p>
                  <el-tag 
                    size="small" 
                    :type="getPriorityType(task.priority)"
                  >
                    {{ task.priority }}
                  </el-tag>
                </div>
                
                <p class="task-description">{{ truncateDescription(task.description) }}</p>
                
                <div class="task-meta">
                  <div class="task-status">
                    <el-tag :type="getStatusType(task.columnId)" size="small">
                      {{ getStatusName(task.columnId) }}
                    </el-tag>
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
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <el-empty description="Выберите проект для просмотра задач по исполнителям" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { formatDate, isOverdue } from '../utils/dateUtils'

const props = defineProps({
  projects: Array,
  currentProject: Object
})

const emit = defineEmits(['update-task'])

// В реальном приложении это бы приходило из props или store
const teamMembers = computed(() => [
  { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer' },
  { id: 2, name: 'Мария Петрова', avatar: '', role: 'UI/UX Designer' },
  { id: 3, name: 'Дмитрий Сидоров', avatar: '', role: 'Backend Developer' },
  { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager' }
])

function getAssigneeTasks(member) {
  if (!props.currentProject) return []
  return props.currentProject.columns.flatMap(column => 
    column.tasks.filter(task => task.assignee?.id === member.id)
  )
}

function getAssigneeTaskCount(member) {
  return getAssigneeTasks(member).length
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

function truncateDescription(description) {
  if (!description) return 'Нет описания'
  return description.length > 100 ? description.substring(0, 100) + '...' : description
}
</script>

<style scoped>
.assignee-view {
  height: 100%;
  padding: 20px;
  background: #f8f9fa;
}

.view-container {
  height: 100%;
  overflow-x: auto;
}

.assignee-columns {
  display: flex;
  gap: 16px;
  height: 100%;
  align-items: flex-start;
}

.assignee-column {
  min-width: 300px;
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
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.assignee-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assignee-details {
  display: flex;
  flex-direction: column;
}

.assignee-name {
  font-weight: 600;
  color: #303133;
}

.assignee-role {
  font-size: 12px;
  color: #909399;
}

.tasks-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.task-card {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.task-card:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
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

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  margin: 20px;
  border-radius: 8px;
}
</style>