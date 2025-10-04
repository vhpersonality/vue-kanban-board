<template>
  <div class="table-view">
    <div class="table-container" v-if="currentProject">
      <!-- Дополнительные контролы таблицы -->
      <div class="table-controls">
        <el-button 
          type="primary" 
          :icon="Plus" 
          @click="$emit('add-task')"
        >
          Новая задача
        </el-button>
        
        <div class="table-actions">
          <el-button :icon="Refresh" @click="refreshTable" />
          <el-button :icon="Download" @click="exportTable" />
          <el-button :icon="Setting" @click="showTableSettings" />
        </div>
      </div>

      <el-table 
        :data="filteredTasks" 
        style="width: 100%"
        empty-text="Нет задач"
        @row-click="handleRowClick"
        v-loading="loading"
        :row-class-name="getRowClassName"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
      >
        <el-table-column type="selection" width="45" />
        
        <el-table-column prop="title" label="Задача" min-width="200" sortable>
          <template #default="scope">
            <div class="task-title-cell">
              <span class="title">{{ scope.row.title }}</span>
              <div class="task-tags" v-if="scope.row.tags && scope.row.tags.length">
                <el-tag
                  v-for="tag in scope.row.tags.slice(0, 2)"
                  :key="tag"
                  size="mini"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
                <el-tag v-if="scope.row.tags.length > 2" size="mini" type="info">
                  +{{ scope.row.tags.length - 2 }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="columnId" label="Статус" width="120" sortable>
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.columnId)">
              {{ getStatusName(scope.row.columnId) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="assignee" label="Исполнитель" width="150" sortable>
          <template #default="scope">
            <div class="assignee-cell" v-if="scope.row.assignee">
              <el-avatar :size="24" :src="scope.row.assignee.avatar" />
              <span class="assignee-name">{{ scope.row.assignee.name }}</span>
            </div>
            <span v-else class="no-assignee">Не назначен</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="priority" label="Приоритет" width="100" sortable>
          <template #default="scope">
            <el-tag :type="getPriorityType(scope.row.priority)" size="small">
              {{ scope.row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="deadline" label="Дедлайн" width="140" sortable>
          <template #default="scope">
            <div class="deadline-cell" :class="{ 
              overdue: isOverdue(scope.row.deadline),
              'due-soon': isDueSoon(scope.row.deadline)
            }">
              <el-icon><Clock /></el-icon>
              {{ formatDate(scope.row.deadline) || 'Не установлен' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="timeEstimate" label="Время" width="100">
          <template #default="scope">
            <div class="time-cell">
              {{ formatTimeEstimate(scope.row.timeEstimate) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="progress" label="Прогресс" width="100">
          <template #default="scope">
            <div class="progress-cell">
              <el-progress 
                :percentage="calculateTaskProgress(scope.row)" 
                :show-text="false"
                size="small"
              />
              <span class="progress-text">
                {{ calculateTaskProgress(scope.row) }}%
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="Создана" width="120" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="updatedAt" label="Обновлена" width="120" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Действия" width="120" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
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
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Пагинация -->
      <div class="table-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalTasks"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <div v-else class="empty-state">
      <el-empty description="Выберите проект для просмотра задач" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Edit, Delete, Clock, Plus, Refresh, Download, Setting } from '@element-plus/icons-vue'
import { formatDate, isOverdue, isDueSoon } from '../utils/dateUtils'
import { debounceFn } from '../utils/helpers'

const props = defineProps({
  projects: Array,
  currentProject: Object,
  filters: Object
})

const emit = defineEmits(['update-task', 'delete-task', 'open-task', 'add-task'])

// Состояние таблицы
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const sort = ref({ prop: 'createdAt', order: 'descending' })

// Все задачи текущего проекта
const allTasks = computed(() => {
  if (!props.currentProject) return []
  return props.currentProject.columns.flatMap(column => 
    column.tasks.map(task => ({
      ...task,
      status: column.title
    }))
  )
})

// Фильтрация задач
const filteredTasks = computed(() => {
  let tasks = [...allTasks.value]

  // Применяем текстовый поиск
  if (props.filters?.searchQuery) {
    const query = props.filters.searchQuery.toLowerCase()
    tasks = tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    )
  }

  // Фильтр по статусу
  if (props.filters?.statusFilter) {
    tasks = tasks.filter(task => task.columnId === props.filters.statusFilter)
  }

  // Фильтр по приоритету
  if (props.filters?.priorityFilter) {
    tasks = tasks.filter(task => task.priority === props.filters.priorityFilter)
  }

  // Фильтр по исполнителю
  if (props.filters?.assigneeFilter) {
    tasks = tasks.filter(task => task.assignee?.id === props.filters.assigneeFilter)
  }

  // Фильтр по тегам
  if (props.filters?.tagFilter?.length) {
    tasks = tasks.filter(task => 
      task.tags && props.filters.tagFilter.every(tag => task.tags.includes(tag))
    )
  }

  // Фильтр по дате
  if (props.filters?.dateRangeFilter?.length === 2) {
    const [start, end] = props.filters.dateRangeFilter
    tasks = tasks.filter(task => {
      if (!task.deadline) return false
      const taskDate = new Date(task.deadline).toISOString().split('T')[0]
      return taskDate >= start && taskDate <= end
    })
  }

  // Сортировка
  if (sort.value.prop) {
    tasks.sort((a, b) => {
      let aVal = a[sort.value.prop]
      let bVal = b[sort.value.prop]

      // Специальная обработка для некоторых полей
      if (sort.value.prop === 'deadline') {
        aVal = aVal ? new Date(aVal) : new Date(0)
        bVal = bVal ? new Date(bVal) : new Date(0)
      }

      if (sort.value.prop === 'assignee') {
        aVal = aVal?.name || ''
        bVal = bVal?.name || ''
      }

      if (aVal < bVal) return sort.value.order === 'ascending' ? -1 : 1
      if (aVal > bVal) return sort.value.order === 'ascending' ? 1 : -1
      return 0
    })
  }

  // Пагинация
  const startIndex = (currentPage.value - 1) * pageSize.value
  return tasks.slice(startIndex, startIndex + pageSize.value)
})

const totalTasks = computed(() => allTasks.value.length)

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

function formatTimeEstimate(timeEstimate) {
  if (!timeEstimate) return '-'
  const { hours, minutes } = timeEstimate
  if (hours === 0 && minutes === 0) return '-'
  return `${hours}ч ${minutes}м`
}

function calculateTaskProgress(task) {
  if (task.subtasks && task.subtasks.length > 0) {
    const completed = task.subtasks.filter(st => st.completed).length
    return Math.round((completed / task.subtasks.length) * 100)
  }
  
  // Альтернативный расчет по статусу
  const statusProgress = {
    'todo': 0,
    'inProgress': 50,
    'review': 80,
    'done': 100
  }
  return statusProgress[task.columnId] || 0
}

function getRowClassName({ row }) {
  const classes = []
  if (isOverdue(row.deadline)) {
    classes.push('overdue-row')
  } else if (isDueSoon(row.deadline)) {
    classes.push('due-soon-row')
  }
  return classes.join(' ')
}

function handleRowClick(task) {
  emit('open-task', task)
}

function editTask(task) {
  emit('update-task', task)
}

function deleteTask(task) {
  emit('delete-task', task.id)
}

function handleSortChange(sortInfo) {
  sort.value = {
    prop: sortInfo.prop,
    order: sortInfo.order
  }
}

function handleFilterChange(filters) {
  console.log('Filter changed:', filters)
}

function handleSizeChange(newSize) {
  pageSize.value = newSize
  currentPage.value = 1
}

function handleCurrentChange(newPage) {
  currentPage.value = newPage
}

function refreshTable() {
  loading.value = true
  // Имитация загрузки
  setTimeout(() => {
    loading.value = false
  }, 500)
}

function exportTable() {
  const data = allTasks.value.map(task => ({
    'Задача': task.title,
    'Статус': getStatusName(task.columnId),
    'Исполнитель': task.assignee?.name || 'Не назначен',
    'Приоритет': task.priority,
    'Дедлайн': formatDate(task.deadline) || 'Не установлен',
    'Создана': formatDate(task.createdAt),
    'Описание': task.description || ''
  }))

  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).map(field => `"${field}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `tasks-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function showTableSettings() {
  // Открытие настроек таблицы
  console.log('Show table settings')
}

// Следим за изменениями фильтров и сбрасываем пагинацию
watch(() => props.filters, () => {
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.table-view {
  height: 100%;
  padding: 20px;
  background: var(--bg-primary);
}

.table-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.task-title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.assignee-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignee-name {
  font-size: 14px;
  color: var(--text-primary);
}

.no-assignee {
  color: var(--text-muted);
  font-style: italic;
}

.deadline-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.deadline-cell.overdue {
  color: var(--danger);
  font-weight: 500;
}

.deadline-cell.due-soon {
  color: var(--warning);
  font-weight: 500;
}

.time-cell {
  font-size: 13px;
  color: var(--text-secondary);
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 35px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.table-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Стили для строк таблицы */
:deep(.el-table .overdue-row) {
  background-color: color-mix(in srgb, var(--danger) 5%, transparent);
}

:deep(.el-table .due-soon-row) {
  background-color: color-mix(in srgb, var(--warning) 5%, transparent);
}

:deep(.el-table .el-table__row:hover) {
  background-color: color-mix(in srgb, var(--primary) 3%, transparent);
}

/* Адаптивность */
@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .table-actions {
    justify-content: center;
  }
  
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-table .cell) {
    padding: 8px 4px;
  }
}
</style>