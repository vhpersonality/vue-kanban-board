<template>
  <div class="assignee-view">
    <div class="view-container" v-if="currentProject">
      <div class="view-header">
        <h2>Задачи по исполнителям</h2>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="Поиск по задачам..."
            :prefix-icon="Search"
            style="width: 200px;"
            clearable
          />
        </div>
      </div>

      <div class="assignee-columns">
        <div 
          v-for="member in filteredTeamMembers" 
          :key="member.id"
          class="assignee-column"
        >
          <div class="column-header">
            <div class="assignee-info">
              <div class="avatar-container">
                <el-avatar :size="32" :src="member.avatar" />
                <div class="online-indicator" :class="{ online: member.isOnline }"></div>
              </div>
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
              @click="$emit('open-task', task)"
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
                
                <p class="task-description" v-if="task.description">
                  {{ truncateDescription(task.description) }}
                </p>

                <!-- Теги задачи -->
                <div class="task-tags" v-if="task.tags && task.tags.length">
                  <el-tag
                    v-for="tag in task.tags.slice(0, 2)"
                    :key="tag"
                    size="mini"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                  <el-tag v-if="task.tags.length > 2" size="mini" type="info">
                    +{{ task.tags.length - 2 }}
                  </el-tag>
                </div>
                
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

                <!-- Прогресс по подзадачам -->
                <div class="task-progress" v-if="task.subtasks && task.subtasks.length > 0">
                  <el-progress 
                    :percentage="calculateSubtasksProgress(task.subtasks)" 
                    :show-text="false"
                    size="small"
                  />
                  <span class="progress-text">
                    {{ getCompletedSubtasksCount(task.subtasks) }}/{{ task.subtasks.length }}
                  </span>
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
import { ref, computed } from 'vue'
import { Clock, Search } from '@element-plus/icons-vue'
import { formatDate, isOverdue } from '../utils/dateUtils'

const props = defineProps({
  projects: Array,
  currentProject: Object,
  teamMembers: Array
})

const emit = defineEmits(['open-task'])

const searchQuery = ref('')

// Фильтрация членов команды, у которых есть задачи в текущем проекте
const filteredTeamMembers = computed(() => {
  return props.teamMembers.filter(member => 
    getAssigneeTasks(member).length > 0 || 
    member.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function getAssigneeTasks(member) {
  if (!props.currentProject) return []
  
  let tasks = props.currentProject.columns.flatMap(column => 
    column.tasks.filter(task => task.assignee?.id === member.id)
  )

  // Применяем поиск, если есть запрос
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tasks = tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    )
  }

  return tasks
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
  if (!description) return ''
  return description.length > 100 ? description.substring(0, 100) + '...' : description
}

function calculateSubtasksProgress(subtasks) {
  if (!subtasks || subtasks.length === 0) return 0
  const completed = subtasks.filter(st => st.completed).length
  return Math.round((completed / subtasks.length) * 100)
}

function getCompletedSubtasksCount(subtasks) {
  return subtasks ? subtasks.filter(st => st.completed).length : 0
}
</script>

<style scoped>
.assignee-view {
  height: 100%;
  padding: 20px;
  background: var(--bg-primary);
}

.view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.view-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.assignee-columns {
  flex: 1;
  display: flex;
  gap: 16px;
  height: 100%;
  align-items: flex-start;
  overflow-x: auto;
}

.assignee-column {
  min-width: 300px;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.assignee-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-container {
  position: relative;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: var(--danger);
  border: 2px solid var(--bg-secondary);
  border-radius: 50%;
}

.online-indicator.online {
  background: var(--success);
}

.assignee-details {
  display: flex;
  flex-direction: column;
}

.assignee-name {
  font-weight: 600;
  color: var(--text-primary);
}

.assignee-role {
  font-size: 12px;
  color: var(--text-muted);
}

.tasks-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.task-card {
  background: var(--bg-primary);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.task-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-description {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
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
  color: var(--danger);
  font-weight: 500;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.progress-text {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 30px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Адаптивность */
@media (max-width: 768px) {
  .assignee-columns {
    flex-direction: column;
  }
  
  .assignee-column {
    min-width: auto;
  }
  
  .view-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    display: flex;
    justify-content: center;
  }
}
</style>