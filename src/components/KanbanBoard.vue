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
            @click="openDialog(column.id)"
          />
        </div>

        <div class="tasks">
          <div
            v-for="task in column.tasks"
            :key="task.id"
            class="task-card"
            draggable="true"
            @dragstart="onDragStart($event, task.id, column.id)"
          >
            <div class="task-content">
              <p><strong>{{ task.title }}</strong></p>
              <p>{{ task.description }}</p>
              <div class="task-footer">
                <el-tag size="small" :type="getPriorityType(task.priority)">
                  {{ task.priority }}
                </el-tag>
                <el-button
                  type="danger"
                  :icon="Delete"
                  size="small"
                  circle
                  @click="deleteTask(column.id, task.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог добавления задачи -->
    <el-dialog v-model="dialogVisible" :title="'Новая задача в ' + getColumnTitle" width="500">
      <el-form :model="newTask">
        <el-form-item label="Заголовок">
          <el-input v-model="newTask.title" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input v-model="newTask.description" type="textarea" />
        </el-form-item>
        <el-form-item label="Приоритет">
          <el-select v-model="newTask.priority" placeholder="Выберите приоритет">
            <el-option label="Низкий" value="Низкий" />
            <el-option label="Средний" value="Средний" />
            <el-option label="Высокий" value="Высокий" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="addTask">Добавить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'

// Состояние колонок
const columns = ref([
  {
    id: 'todo',
    title: 'Сделать',
    tasks: [
      { id: 1, title: 'Изучить Vue 3', description: 'Прочитать документацию', priority: 'Высокий' },
      { id: 2, title: 'Купить продукты', description: 'Молоко, хлеб, фрукты', priority: 'Средний' }
    ]
  },
  {
    id: 'inProgress',
    title: 'В процессе',
    tasks: [
      { id: 3, title: 'Разработать канбан-доску', description: 'На Vue 3 и Element Plus', priority: 'Высокий' }
    ]
  },
  {
    id: 'done',
    title: 'Готово',
    tasks: [
      { id: 4, title: 'Создать проект', description: 'Инициализировать Vue приложение', priority: 'Низкий' }
    ]
  }
])

// Работа с диалогом
const dialogVisible = ref(false)
const currentColumnId = ref('')
const newTask = ref({
  title: '',
  description: '',
  priority: 'Средний'
})

const getColumnTitle = computed(() => {
  const column = columns.value.find(col => col.id === currentColumnId.value)
  return column ? column.title : ''
})

function openDialog(columnId) {
  currentColumnId.value = columnId
  dialogVisible.value = true
  newTask.value = { title: '', description: '', priority: 'Средний' }
}

function addTask() {
  if (!newTask.value.title.trim()) return
  
  const column = columns.value.find(col => col.id === currentColumnId.value)
  if (column) {
    column.tasks.push({
      id: Date.now(),
      ...newTask.value
    })
  }
  
  dialogVisible.value = false
}

// Удаление задачи
function deleteTask(columnId, taskId) {
  const column = columns.value.find(col => col.id === columnId)
  if (column) {
    column.tasks = column.tasks.filter(task => task.id !== taskId)
  }
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
        targetColumn.tasks.push(task)
      }
    }
  }
  
  draggedTaskId = null
  sourceColumnId = null
}

// Цвет приоритета
function getPriorityType(priority) {
  switch (priority) {
    case 'Высокий': return 'danger'
    case 'Средний': return 'warning'
    case 'Низкий': return 'success'
    default: return 'info'
  }
}
</script>

<style scoped>
.kanban-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.board {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 20px 0;
}

.column {
  min-width: 300px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  min-height: 500px;
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
  gap: 10px;
}

.task-card {
  background: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: move;
  transition: all 0.3s ease;
  border-left: 4px solid #409eff;
}

.task-card:hover {
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transform: translateY(-2px);
}

.task-content p {
  margin: 5px 0;
}

.task-content p:first-child {
  font-size: 14px;
  color: #2c3e50;
}

.task-content p:last-child {
  font-size: 12px;
  color: #7f8c8d;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .board {
    flex-direction: column;
  }
  
  .column {
    min-width: auto;
  }
}
</style>