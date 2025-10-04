<template>
  <div class="table-view">
    <div class="table-container" v-if="currentProject">
      <el-table 
        :data="allTasks" 
        style="width: 100%"
        empty-text="Нет задач"
        @row-click="handleRowClick"
      >
        <el-table-column prop="title" label="Задача" min-width="200">
          <template #default="scope">
            <div class="task-title-cell">
              <span class="title">{{ scope.row.title }}</span>
              <div class="description" v-if="scope.row.description">
                {{ scope.row.description }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="columnId" label="Статус" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.columnId)">
              {{ getStatusName(scope.row.columnId) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="assignee" label="Исполнитель" width="150">
          <template #default="scope">
            <div class="assignee-cell" v-if="scope.row.assignee">
              <el-avatar :size="24" :src="scope.row.assignee.avatar" />
              <span class="assignee-name">{{ scope.row.assignee.name }}</span>
            </div>
            <span v-else class="no-assignee">Не назначен</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="priority" label="Приоритет" width="100">
          <template #default="scope">
            <el-tag :type="getPriorityType(scope.row.priority)" size="small">
              {{ scope.row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="deadline" label="Дедлайн" width="140">
          <template #default="scope">
            <div class="deadline-cell" :class="{ overdue: isOverdue(scope.row.deadline) }">
              {{ formatDate(scope.row.deadline) || 'Не установлен' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="Создана" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Действия" width="100" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              circle
              @click.stop="editTask(scope.row)"
            />
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              circle
              @click.stop="deleteTask(scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div v-else class="empty-state">
      <el-empty description="Выберите проект для просмотра задач" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { formatDate, isOverdue } from '../utils/dateUtils'

const props = defineProps({
  projects: Array,
  currentProject: Object
})

const emit = defineEmits(['update-task', 'delete-task'])

const allTasks = computed(() => {
  if (!props.currentProject) return []
  return props.currentProject.columns.flatMap(column => 
    column.tasks.map(task => ({
      ...task,
      status: column.title
    }))
  )
})

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

function handleRowClick(task) {
  // Можно открыть диалог редактирования
  editTask(task)
}

function editTask(task) {
  emit('update-task', task)
}

function deleteTask(task) {
  emit('delete-task', task.id)
}
</script>

<style scoped>
.table-view {
  height: 100%;
  padding: 20px;
  background: white;
}

.table-container {
  height: 100%;
  overflow: auto;
}

.task-title-cell .title {
  font-weight: 600;
  color: #303133;
}

.task-title-cell .description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.assignee-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignee-name {
  font-size: 14px;
}

.no-assignee {
  color: #c0c4cc;
  font-style: italic;
}

.deadline-cell.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>