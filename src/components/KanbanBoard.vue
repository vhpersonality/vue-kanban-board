<template>
  <div class="kanban-container">
    <h1>Моя Канбан Доска</h1>
    
    <div class="board">
      <div 
        v-for="column in columns" 
        :key="column.id"
        class="column"
        @drop="onDrop($event, column.id)"
        @dragover.prevent
        @dragenter.prevent
      >
        <div class="column-header">
          <h3>{{ column.title }} ({{ column.tasks.length }})</h3>
          <el-button 
            type="primary" 
            :icon="Plus" 
            circle 
            @click="openAddTaskDialog(column.id)"
          />
        </div>

        <div class="tasks">
          <div
            v-for="task in column.tasks"
            :key="task.id"
            class="task-card"
            draggable="true"
            @dragstart="onDragStart($event, task.id, column.id)"
            @click="openTaskDetails(task)"
          >
            <div class="task-content">
              <div class="task-header">
                <p class="task-title">{{ task.title }}</p>
                <el-tag 
                  size="small" 
                  :type="getPriorityType(task.priority)"
                  :effect="isOverdue(task.deadline) ? 'dark' : 'light'"
                >
                  {{ task.priority }}
                </el-tag>
              </div>
              
              <p class="task-description">{{ truncateDescription(task.description) }}</p>
              
              <div class="task-footer">
                <div class="task-meta">
                  <div v-if="task.deadline" class="deadline-info">
                    <el-icon><Clock /></el-icon>
                    <span :class="{ 'overdue': isOverdue(task.deadline) }">
                      {{ formatDate(task.deadline) }}
                    </span>
                  </div>
                  <div v-else class="no-deadline">
                    <el-icon><Clock /></el-icon>
                    <span>Без срока</span>
                  </div>
                </div>
                
                <div class="task-actions">
                  <el-button
                    type="danger"
                    :icon="Delete"
                    size="small"
                    circle
                    @click.stop="deleteTask(column.id, task.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог добавления задачи -->
    <el-dialog 
      v-model="addDialogVisible" 
      :title="'Новая задача в ' + getColumnTitle" 
      width="600"
    >
      <el-form :model="newTask" label-width="120px">
        <el-form-item label="Заголовок" required>
          <el-input v-model="newTask.title" autocomplete="off" />
        </el-form-item>
        
        <el-form-item label="Описание">
          <el-input 
            v-model="newTask.description" 
            type="textarea" 
            :rows="4"
            placeholder="Подробное описание задачи..."
          />
        </el-form-item>
        
        <el-form-item label="Приоритет">
          <el-select v-model="newTask.priority" placeholder="Выберите приоритет">
            <el-option label="Низкий" value="Низкий" />
            <el-option label="Средний" value="Средний" />
            <el-option label="Высокий" value="Высокий" />
            <el-option label="Критичный" value="Критичный" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Дедлайн">
          <el-date-picker
            v-model="newTask.deadline"
            type="datetime"
            placeholder="Выберите дату и время"
            format="DD.MM.YYYY HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="addDialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="addTask" :disabled="!newTask.title.trim()">
          Добавить
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог деталей задачи -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="currentTask?.title" 
      width="700"
      @close="closeTaskDetails"
    >
      <div v-if="currentTask" class="task-details">
        <div class="detail-section">
          <h3>Описание</h3>
          <p class="task-full-description">{{ currentTask.description || 'Нет описания' }}</p>
        </div>
        
        <div class="detail-grid">
          <div class="detail-item">
            <label>Приоритет:</label>
            <el-tag :type="getPriorityType(currentTask.priority)">
              {{ currentTask.priority }}
            </el-tag>
          </div>
          
          <div class="detail-item">
            <label>Статус:</label>
            <span>{{ getColumnTitleById(currentTask.columnId) }}</span>
          </div>
          
          <div class="detail-item">
            <label>Создана:</label>
            <span>{{ formatDate(currentTask.createdAt) }}</span>
          </div>
          
          <div class="detail-item">
            <label>Обновлена:</label>
            <span>{{ formatDate(currentTask.updatedAt) }}</span>
          </div>
          
          <div class="detail-item full-width">
            <label>Дедлайн:</label>
            <div class="deadline-display">
              <span v-if="currentTask.deadline" :class="{ 'overdue': isOverdue(currentTask.deadline) }">
                {{ formatDate(currentTask.deadline) }}
              </span>
              <span v-else class="no-deadline">Не установлен</span>
              
              <div v-if="currentTask.deadline" class="time-remaining">
                <el-tag :type="getTimeRemainingType(currentTask.deadline)" size="small">
                  {{ getTimeRemainingText(currentTask.deadline) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Трекинг времени</h3>
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
      </div>
      
      <template #footer>
        <el-button @click="closeTaskDetails">Закрыть</el-button>
        <el-button type="primary" @click="editTask(currentTask)">
          Редактировать
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог редактирования задачи -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="'Редактирование: ' + currentTask?.title" 
      width="600"
    >
      <el-form :model="editingTask" label-width="120px" v-if="editingTask">
        <el-form-item label="Заголовок" required>
          <el-input v-model="editingTask.title" autocomplete="off" />
        </el-form-item>
        
        <el-form-item label="Описание">
          <el-input 
            v-model="editingTask.description" 
            type="textarea" 
            :rows="4"
            placeholder="Подробное описание задачи..."
          />
        </el-form-item>
        
        <el-form-item label="Приоритет">
          <el-select v-model="editingTask.priority" placeholder="Выберите приоритет">
            <el-option label="Низкий" value="Низкий" />
            <el-option label="Средний" value="Средний" />
            <el-option label="Высокий" value="Высокий" />
            <el-option label="Критичный" value="Критичный" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Дедлайн">
          <el-date-picker
            v-model="editingTask.deadline"
            type="datetime"
            placeholder="Выберите дату и время"
            format="DD.MM.YYYY HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="Статус">
          <el-select v-model="editingTask.columnId" placeholder="Выберите статус">
            <el-option 
              v-for="column in columns" 
              :key="column.id"
              :label="column.title" 
              :value="column.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="saveTask" :disabled="!editingTask?.title.trim()">
          Сохранить
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Delete, Clock } from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue } from '../utils/dateUtils'

// Состояние колонок с дополнительными полями
const columns = ref([
  {
    id: 'todo',
    title: 'Сделать',
    tasks: [
      { 
        id: 1, 
        title: 'Изучить Vue 3', 
        description: 'Прочитать документацию и сделать несколько примеров', 
        priority: 'Высокий',
        deadline: '2024-12-31 18:00:00',
        createdAt: '2024-01-15 10:00:00',
        updatedAt: '2024-01-15 10:00:00',
        columnId: 'todo'
      },
      { 
        id: 2, 
        title: 'Купить продукты', 
        description: 'Молоко, хлеб, фрукты, овощи', 
        priority: 'Средний',
        deadline: null,
        createdAt: '2024-01-14 09:30:00',
        updatedAt: '2024-01-14 09:30:00',
        columnId: 'todo'
      }
    ]
  },
  {
    id: 'inProgress',
    title: 'В процессе',
    tasks: [
      { 
        id: 3, 
        title: 'Разработать канбан-доску', 
        description: 'Создать канбан-доску на Vue 3 и Element Plus с drag-and-drop функционалом', 
        priority: 'Высокий',
        deadline: '2024-01-20 23:59:00',
        createdAt: '2024-01-10 14:20:00',
        updatedAt: '2024-01-15 11:30:00',
        columnId: 'inProgress'
      }
    ]
  },
  {
    id: 'done',
    title: 'Готово',
    tasks: [
      { 
        id: 4, 
        title: 'Создать проект', 
        description: 'Инициализировать Vue приложение и настроить базовую структуру', 
        priority: 'Низкий',
        deadline: '2024-01-12 17:00:00',
        createdAt: '2024-01-08 13:15:00',
        updatedAt: '2024-01-12 16:45:00',
        columnId: 'done'
      }
    ]
  }
])

// Диалоги
const addDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)

// Текущие данные
const currentColumnId = ref('')
const currentTask = ref(null)
const editingTask = ref(null)

const newTask = ref({
  title: '',
  description: '',
  priority: 'Средний',
  deadline: null
})

const getColumnTitle = computed(() => {
  const column = columns.value.find(col => col.id === currentColumnId.value)
  return column ? column.title : ''
})

// Таймер для обновления времени
let timeUpdateInterval = null

onMounted(() => {
  // Обновляем отображение времени каждую минуту
  timeUpdateInterval = setInterval(() => {
    // Принудительное обновление через реактивность
    columns.value = [...columns.value]
  }, 60000)
})

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})

// Методы для задач
function openAddTaskDialog(columnId) {
  currentColumnId.value = columnId
  addDialogVisible.value = true
  newTask.value = { 
    title: '', 
    description: '', 
    priority: 'Средний',
    deadline: null
  }
}

function addTask() {
  if (!newTask.value.title.trim()) return
  
  const column = columns.value.find(col => col.id === currentColumnId.value)
  if (column) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    column.tasks.push({
      id: Date.now(),
      ...newTask.value,
      createdAt: now,
      updatedAt: now,
      columnId: currentColumnId.value
    })
  }
  
  addDialogVisible.value = false
}

function deleteTask(columnId, taskId) {
  const column = columns.value.find(col => col.id === columnId)
  if (column) {
    column.tasks = column.tasks.filter(task => task.id !== taskId)
  }
}

function openTaskDetails(task) {
  currentTask.value = { ...task }
  detailDialogVisible.value = true
}

function closeTaskDetails() {
  detailDialogVisible.value = false
  currentTask.value = null
}

function editTask(task) {
  editingTask.value = { ...task }
  detailDialogVisible.value = false
  editDialogVisible.value = true
}

function saveTask() {
  if (!editingTask.value?.title.trim()) return

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  editingTask.value.updatedAt = now

  // Находим задачу в исходной колонке и обновляем или перемещаем
  let found = false
  columns.value.forEach(column => {
    const taskIndex = column.tasks.findIndex(t => t.id === editingTask.value.id)
    if (taskIndex !== -1) {
      // Если колонка изменилась, перемещаем задачу
      if (column.id !== editingTask.value.columnId) {
        column.tasks.splice(taskIndex, 1)
      } else {
        column.tasks[taskIndex] = { ...editingTask.value }
        found = true
      }
    }
  })

  // Если задача перемещается в другую колонку
  if (!found) {
    const targetColumn = columns.value.find(col => col.id === editingTask.value.columnId)
    if (targetColumn) {
      targetColumn.tasks.push({ ...editingTask.value })
    }
  }

  editDialogVisible.value = false
  editingTask.value = null
}

// Вспомогательные методы
function truncateDescription(description) {
  if (!description) return 'Нет описания'
  return description.length > 100 ? description.substring(0, 100) + '...' : description
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

function getColumnTitleById(columnId) {
  const column = columns.value.find(col => col.id === columnId)
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

// Drag and Drop
let draggedTaskId = null
let sourceColumnId = null

function onDragStart(event, taskId, columnId) {
  draggedTaskId = taskId
  sourceColumnId = columnId
  event.dataTransfer.effectAllowed = 'move'
}

function onDrop(event, targetColumnId) {
  if (draggedTaskId && sourceColumnId !== targetColumnId) {
    const sourceColumn = columns.value.find(col => col.id === sourceColumnId)
    const targetColumn = columns.value.find(col => col.id === targetColumnId)
    
    if (sourceColumn && targetColumn) {
      const taskIndex = sourceColumn.tasks.findIndex(task => task.id === draggedTaskId)
      if (taskIndex !== -1) {
        const [task] = sourceColumn.tasks.splice(taskIndex, 1)
        task.columnId = targetColumnId
        task.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
        targetColumn.tasks.push(task)
      }
    }
  }
  
  draggedTaskId = null
  sourceColumnId = null
}
</script>

<style scoped>
.kanban-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.board {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 20px 0;
}

.column {
  min-width: 320px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  min-height: 600px;
  border: 2px solid #e0e0e0;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.column-header h3 {
  margin: 0;
  color: #333;
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #409eff;
}

.task-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.task-title {
  font-weight: bold;
  font-size: 14px;
  color: #2c3e50;
  margin: 0;
  flex: 1;
  margin-right: 10px;
}

.task-description {
  font-size: 12px;
  color: #7f8c8d;
  margin: 8px 0;
  line-height: 1.4;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.task-meta {
  flex: 1;
}

.deadline-info, .no-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.task-actions {
  display: flex;
  gap: 4px;
}

/* Детали задачи */
.task-details {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  margin-bottom: 10px;
  color: #303133;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 5px;
}

.task-full-description {
  line-height: 1.6;
  color: #606266;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #909399;
  font-size: 12px;
}

.deadline-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-remaining {
  margin-left: 10px;
}

.time-tracking {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.time-label {
  font-weight: 600;
  color: #606266;
}

.time-value {
  color: #409eff;
  font-weight: 500;
}

@media (max-width: 768px) {
  .board {
    flex-direction: column;
  }
  
  .column {
    min-width: auto;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .time-tracking {
    grid-template-columns: 1fr;
  }
  
  .deadline-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>