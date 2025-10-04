<template>
  <div class="kanban-view">
    <div class="board" v-if="currentProject">
      <draggable 
        v-model="columns" 
        group="columns"
        item-key="id"
        class="columns-container"
        @end="onColumnDragEnd"
        :disabled="isDraggingDisabled"
      >
        <template #item="{ element: column }">
          <div 
            class="column-wrapper"
            @mouseenter="hoveredColumn = column.id"
            @mouseleave="hoveredColumn = null"
          >
            <div class="column" :style="{ '--column-color': column.color || '#409EFF' }">
              <div class="column-header">
                <div class="column-title-section">
                  <div 
                    class="column-color-indicator"
                    :style="{ backgroundColor: column.color || '#409EFF' }"
                    @click="$emit('change-color', column)"
                  ></div>
                  
                  <div 
                    v-if="!column.editing"
                    class="column-title-display"
                    @click="startEditingColumn(column)"
                  >
                    <span class="column-title">{{ column.title }}</span>
                    <span class="task-count">{{ getFilteredTasks(column.tasks).length }}</span>
                  </div>
                  
                  <el-input
                    v-else
                    v-model="column.title"
                    @blur="finishEditingColumn(column)"
                    @keyup.enter="finishEditingColumn(column)"
                    class="column-title-input"
                    size="small"
                    ref="columnInput"
                    autofocus
                  />
                </div>
                
                <div class="column-menu" v-show="hoveredColumn === column.id">
                  <el-dropdown trigger="click" @command="(command) => handleColumnCommand(command, column)">
                    <el-button
                      :icon="More"
                      size="small"
                      text
                      circle
                    />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="changeColor">
                          <el-icon><Brush /></el-icon>
                          Изменить цвет
                        </el-dropdown-item>
                        <el-dropdown-item command="addTask">
                          <el-icon><Plus /></el-icon>
                          Добавить задачу
                        </el-dropdown-item>
                        <el-dropdown-item divided command="deleteColumn" :disabled="columns.length <= 1">
                          <el-icon><Delete /></el-icon>
                          Удалить колонку
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <draggable
                v-model="column.tasks"
                group="tasks"
                item-key="id"
                class="tasks"
                @end="onTaskDragEnd"
                :data-column-id="column.id"
              >
                <template #item="{ element: task }">
                  <div
                    class="task-card"
                    @click="$emit('open-task', task)"
                    :data-id="task.id"
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
                      
                      <p class="task-description" v-if="task.description">
                        {{ truncateDescription(task.description) }}
                      </p>
                      
                      <div class="task-meta">
                        <div class="assignee-info" v-if="task.assignee">
                          <el-avatar :size="20" :src="task.assignee.avatar" />
                          <span class="assignee-name">{{ task.assignee.name }}</span>
                        </div>
                        
                        <div class="task-tags">
                          <div v-if="task.deadline" class="deadline-info">
                            <el-icon><Clock /></el-icon>
                            <span :class="{ 'overdue': isOverdue(task.deadline) }">
                              {{ formatDate(task.deadline) }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- Теги задачи -->
                      <div class="task-tags-list" v-if="task.tags && task.tags.length">
                        <el-tag
                          v-for="tag in task.tags.slice(0, 3)"
                          :key="tag"
                          size="mini"
                          type="info"
                          class="task-tag"
                        >
                          {{ tag }}
                        </el-tag>
                        <el-tag v-if="task.tags.length > 3" size="mini" type="info">
                          +{{ task.tags.length - 3 }}
                        </el-tag>
                      </div>

                      <!-- Прогресс -->
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
                </template>
              </draggable>

              <!-- Кнопка добавления задачи -->
              <div class="column-footer" v-show="hoveredColumn === column.id">
                <el-button 
                  type="primary" 
                  text 
                  :icon="Plus"
                  @click="$emit('add-task', column.id)"
                >
                  Добавить задачу
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Кнопка добавления колонки -->
      <div class="add-column-section">
        <el-button 
          type="primary" 
          :icon="Plus" 
          @click="$emit('add-column')"
          class="add-column-btn"
        >
          Добавить колонку
        </el-button>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="empty-state">
      <el-empty description="Выберите или создайте проект">
        <el-button type="primary" @click="$emit('create-project')">
          Создать проект
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Delete, Clock, More, Brush } from '@element-plus/icons-vue'
import { formatDate, isOverdue } from '../utils/dateUtils'
import draggable from 'vuedraggable'

const props = defineProps({
  currentProject: Object,
  filters: Object
})

const emit = defineEmits([
  'open-task',
  'add-task',
  'add-column',
  'change-color',
  'create-project',
  'task-drag-end',
  'column-drag-end'
])

const hoveredColumn = ref(null)
const isDraggingDisabled = computed(() => window.innerWidth < 768)

const columns = computed({
  get: () => props.currentProject?.columns || [],
  set: (value) => {
    if (props.currentProject) {
      props.currentProject.columns = value
    }
  }
})

function getFilteredTasks(tasks) {
  if (!props.filters) return tasks
  
  return tasks.filter(task => {
    const matchesSearch = !props.filters.searchQuery || 
      task.title.toLowerCase().includes(props.filters.searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(props.filters.searchQuery.toLowerCase())

    const matchesStatus = !props.filters.statusFilter || task.columnId === props.filters.statusFilter
    const matchesPriority = !props.filters.priorityFilter || task.priority === props.filters.priorityFilter
    const matchesAssignee = !props.filters.assigneeFilter || task.assignee?.id === props.filters.assigneeFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })
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

function startEditingColumn(column) {
  column.editing = true
}

function finishEditingColumn(column) {
  column.editing = false
}

function handleColumnCommand(command, column) {
  emit(command === 'addTask' ? 'add-task' : command, column)
}

function onTaskDragEnd(evt) {
  emit('task-drag-end', evt)
}

function onColumnDragEnd(evt) {
  emit('column-drag-end', evt)
}
</script>

<style scoped>
.kanban-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.board {
  flex: 1;
  padding: 20px 0;
  overflow-x: auto;
  background: var(--bg-primary);
}

.columns-container {
  display: flex;
  gap: 20px;
  height: 100%;
  align-items: flex-start;
  min-width: min-content;
}

.column-wrapper {
  min-width: 280px;
  max-width: 320px;
  flex-shrink: 0;
}

.column {
  background: color-mix(in srgb, var(--column-color) 5%, var(--bg-secondary));
  border-radius: 12px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--column-color) 15%, var(--border-color));
  transition: all 0.3s ease;
}

.column:hover {
  box-shadow: var(--shadow-md);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--column-color) 10%, var(--border-color));
}

.column-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.column-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.column-color-indicator:hover {
  transform: scale(1.1);
}

.column-title-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.column-title-display:hover {
  background-color: color-mix(in srgb, var(--column-color) 8%, transparent);
}

.column-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-count {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--column-color) 15%, var(--bg-secondary));
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.column-title-input {
  flex: 1;
}

.column-menu {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.column-wrapper:hover .column-menu {
  opacity: 1;
}

.tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 4px;
}

.task-card {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--column-color, var(--primary));
  box-shadow: var(--shadow-sm);
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
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
  line-height: 1.4;
  flex: 1;
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

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.assignee-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.assignee-name {
  font-size: 11px;
  color: var(--text-muted);
}

.task-tags {
  display: flex;
  align-items: center;
  gap: 8px;
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

.task-tags-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.task-tag {
  font-size: 10px;
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

.column-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--column-color) 10%, var(--border-color));
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.column-wrapper:hover .column-footer {
  opacity: 1;
}

.add-column-section {
  margin-left: 20px;
  flex-shrink: 0;
}

.add-column-btn {
  height: 100%;
  min-height: 200px;
  width: 280px;
  border: 2px dashed var(--border-color);
  background: var(--bg-secondary);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.add-column-btn:hover {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 5%, var(--bg-secondary));
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  margin: 20px;
  border-radius: 8px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .columns-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .column-wrapper {
    min-width: auto;
    max-width: none;
    width: 100%;
  }
  
  .add-column-section {
    margin-left: 0;
    margin-top: 16px;
  }
  
  .add-column-btn {
    width: 100%;
    min-height: 80px;
  }
  
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>