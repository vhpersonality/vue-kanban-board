<template>
  <div class="task-detail-content" v-if="task">
    <!-- Заголовок -->
    <div class="task-detail-header">
      <el-button 
        :icon="Close" 
        text 
        circle 
        @click="$emit('close')"
        class="close-btn"
      />
    </div>

    <div class="task-detail-body">
      <!-- Название задачи -->
      <div class="task-title-section">
        <h1 class="task-main-title">{{ task.title }}</h1>
      </div>

      <!-- Трекинг времени -->
      <div class="time-tracking-section">
        <div class="time-tracking-card">
          <div class="time-display">
            <div class="time-estimate">
              <label>Оценка времени:</label>
              <div class="time-input-group">
                <el-input-number 
                  v-model="localTask.timeEstimate.hours" 
                  :min="0" 
                  :max="999" 
                  size="small"
                  placeholder="Час"
                  @change="updateTask"
                />
                <span>ч</span>
                <el-input-number 
                  v-model="localTask.timeEstimate.minutes" 
                  :min="0" 
                  :max="59" 
                  size="small"
                  placeholder="Мин"
                  @change="updateTask"
                />
                <span>м</span>
              </div>
            </div>
            
            <div class="time-tracked">
              <label>Затрачено времени:</label>
              <div class="tracked-time">
                <span class="time-value">{{ formatTrackedTime(localTask.timeTracked) }}</span>
                <div class="timer-controls">
                  <el-button 
                    type="primary" 
                    :icon="localTask.timerRunning ? VideoPause : VideoPlay" 
                    circle 
                    size="small"
                    @click="$emit('toggle-timer')"
                    :class="{ active: localTask.timerRunning }"
                  />
                  <el-button 
                    type="danger" 
                    :icon="RefreshRight" 
                    circle 
                    size="small"
                    @click="$emit('reset-timer')"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Основные свойства -->
      <div class="task-properties">
        <div class="property-row">
          <div class="property-item">
            <label class="property-label">Статус</label>
            <div class="property-value">
              <el-select 
                v-model="localTask.columnId" 
                @change="updateTask"
                placeholder="Выберите статус"
              >
                <el-option 
                  v-for="column in availableColumns"
                  :key="column.id"
                  :label="column.title"
                  :value="column.id"
                />
              </el-select>
            </div>
          </div>
          
          <div class="property-item">
            <label class="property-label">Приоритет</label>
            <div class="property-value">
              <el-select 
                v-model="localTask.priority" 
                @change="updateTask"
                placeholder="Выберите приоритет"
              >
                <el-option label="Критичный" value="Критичный" />
                <el-option label="Высокий" value="Высокий" />
                <el-option label="Средний" value="Средний" />
                <el-option label="Низкий" value="Низкий" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="property-row">
          <div class="property-item">
            <label class="property-label">Исполнитель</label>
            <div class="property-value">
              <el-select 
                v-model="localTask.assignee" 
                @change="updateTask"
                placeholder="Выберите исполнителя"
                filterable
                clearable
              >
                <el-option label="Не назначен" :value="null" />
                <el-option 
                  v-for="member in teamMembers"
                  :key="member.id"
                  :label="member.name"
                  :value="member"
                >
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-avatar :size="24" :src="member.avatar" />
                    <span>{{ member.name }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>

          <div class="property-item">
            <label class="property-label">Постановщик</label>
            <div class="property-value">
              <div class="user-display">
                <el-avatar :size="32" :src="task.creator?.avatar || currentUser.avatar" />
                <div class="user-info">
                  <span class="user-name">{{ task.creator?.name || currentUser.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="property-item full-width">
          <label class="property-label">Теги</label>
          <div class="property-value">
            <el-select 
              v-model="localTask.tags" 
              multiple 
              filterable 
              allow-create
              placeholder="Добавьте теги"
              @change="updateTask"
            >
              <el-option 
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>
        </div>

        <div class="property-item full-width">
          <label class="property-label">Дедлайн</label>
          <div class="property-value">
            <div class="deadline-controls">
              <el-date-picker
                v-model="localTask.deadline"
                type="datetime"
                placeholder="Установите дедлайн"
                value-format="YYYY-MM-DD HH:mm:ss"
                @change="updateTask"
              />
              <el-tag 
                v-if="localTask.deadline" 
                :type="getTimeRemainingType(localTask.deadline)" 
                size="small"
                class="time-remaining-tag"
              >
                {{ getTimeRemainingText(localTask.deadline) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- Подзадачи -->
      <div class="subtasks-section">
        <div class="section-header">
          <h3>Подзадачи</h3>
          <el-button type="primary" :icon="Plus" size="small" @click="$emit('add-subtask')">
            Добавить
          </el-button>
        </div>
        
        <div class="subtasks-list">
          <div 
            v-for="(subtask, index) in localTask.subtasks" 
            :key="subtask.id"
            class="subtask-item"
          >
            <el-checkbox 
              v-model="subtask.completed" 
              @change="$emit('update-subtask', subtask)"
            >
              <el-input
                v-model="subtask.title"
                @blur="$emit('update-subtask', subtask)"
                @keyup.enter="$event.target.blur()"
                size="small"
                :class="{ completed: subtask.completed }"
              />
            </el-checkbox>
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              text
              circle
              @click="$emit('remove-subtask', index)"
            />
          </div>
          
          <div v-if="!localTask.subtasks || localTask.subtasks.length === 0" class="empty-subtasks">
            <p>Нет подзадач</p>
          </div>
        </div>
      </div>

      <!-- Чек-лист -->
      <div class="checklist-section">
        <div class="section-header">
          <h3>Чек-лист</h3>
          <el-button type="primary" :icon="Plus" size="small" @click="$emit('add-checklist')">
            Добавить
          </el-button>
        </div>
        
        <div class="checklist-items">
          <div 
            v-for="(item, index) in localTask.checklist" 
            :key="item.id"
            class="checklist-item"
          >
            <el-checkbox 
              v-model="item.completed" 
              @change="$emit('update-checklist', item)"
            >
              <el-input
                v-model="item.text"
                @blur="$emit('update-checklist', item)"
                @keyup.enter="$event.target.blur()"
                size="small"
                :class="{ completed: item.completed }"
              />
            </el-checkbox>
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              text
              circle
              @click="$emit('remove-checklist', index)"
            />
          </div>
          
          <div v-if="!localTask.checklist || localTask.checklist.length === 0" class="empty-checklist">
            <p>Нет пунктов в чек-листе</p>
          </div>
        </div>
      </div>

      <!-- Описание задачи -->
      <div class="description-section">
        <div class="section-header">
          <h3>Описание</h3>
          <el-button 
            type="primary" 
            :icon="Edit" 
            size="small" 
            @click="startEditingDescription"
          >
            Редактировать
          </el-button>
        </div>
        <div class="task-description-content">
          <el-input
            v-if="editingDescription"
            v-model="localTask.description"
            type="textarea"
            :rows="4"
            placeholder="Добавьте описание задачи..."
            @blur="finishEditingDescription"
            @keyup.enter="finishEditingDescription"
            autofocus
          />
          <div v-else @click="startEditingDescription" class="description-editable">
            <p v-if="localTask.description" class="description-text">
              {{ localTask.description }}
            </p>
            <p v-else class="empty-description">
              Нажмите чтобы добавить описание...
            </p>
          </div>
        </div>
      </div>

      <!-- Комментарии -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>Комментарии</h3>
          <span class="comments-count">{{ localTask.comments?.length || 0 }}</span>
        </div>
        
        <!-- Список комментариев -->
        <div class="comments-list" v-if="localTask.comments && localTask.comments.length > 0">
          <div 
            v-for="comment in localTask.comments" 
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-header">
              <el-avatar :size="28" :src="comment.author.avatar" />
              <div class="comment-author">
                <span class="author-name">{{ comment.author.name }}</span>
                <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
              </div>
            </div>
            <div class="comment-content">
              {{ comment.content }}
            </div>
          </div>
        </div>
        
        <!-- Пустые комментарии -->
        <div v-else class="empty-comments">
          <p>Пока нет комментариев</p>
        </div>

        <!-- Форма добавления комментария -->
        <div class="add-comment-section">
          <div class="comment-input-wrapper">
            <el-avatar :size="32" :src="currentUser.avatar" class="current-user-avatar" />
            <div class="comment-input-container">
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="3"
                placeholder="Напишите комментарий..."
                class="comment-input"
                @keydown.ctrl.enter="addComment"
              />
              <div class="comment-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="addComment"
                  :disabled="!newComment.trim()"
                >
                  Отправить (Ctrl+Enter)
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Футер с действиями -->
    <div class="task-detail-footer">
      <el-button @click="$emit('close')">Закрыть</el-button>
      <el-button type="danger" :icon="Delete" @click="deleteTask">
        Удалить задачу
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { 
  Close, VideoPlay, VideoPause, RefreshRight, Plus, Delete, Edit 
} from '@element-plus/icons-vue'
import { formatDate, getTimeRemaining, isOverdue, formatCommentTime } from '../../utils/dateUtils'

const props = defineProps({
  task: Object,
  currentUser: Object,
  teamMembers: Array,
  availableTags: Array,
  availableColumns: Array
})

const emit = defineEmits([
  'update-task',
  'close',
  'toggle-timer',
  'reset-timer',
  'add-subtask',
  'update-subtask',
  'remove-subtask',
  'add-checklist',
  'update-checklist',
  'remove-checklist',
  'add-comment',
  'delete-task'
])

const localTask = ref({})
const newComment = ref('')
const editingDescription = ref(false)

// Инициализация локальной копии задачи
watch(() => props.task, (newTask) => {
  if (newTask) {
    localTask.value = { ...newTask }
    // Убедимся, что все необходимые поля существуют
    if (!localTask.value.tags) localTask.value.tags = []
    if (!localTask.value.subtasks) localTask.value.subtasks = []
    if (!localTask.value.checklist) localTask.value.checklist = []
    if (!localTask.value.comments) localTask.value.comments = []
    if (!localTask.value.timeEstimate) localTask.value.timeEstimate = { hours: 0, minutes: 0 }
    if (!localTask.value.timeTracked) localTask.value.timeTracked = { hours: 0, minutes: 0, seconds: 0 }
  }
}, { immediate: true, deep: true })

function updateTask() {
  emit('update-task', localTask.value)
}

function formatTrackedTime(time) {
  if (!time) return '00:00:00'
  const { hours, minutes, seconds } = time
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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

function startEditingDescription() {
  editingDescription.value = true
}

function finishEditingDescription() {
  editingDescription.value = false
  updateTask()
}

function addComment() {
  if (!newComment.value.trim()) return
  
  emit('add-comment', newComment.value)
  newComment.value = ''
}

function deleteTask() {
  emit('delete-task', localTask.value.id)
}
</script>

<style scoped>
.task-detail-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-detail-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  color: var(--text-muted);
}

.task-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.task-title-section {
  margin-bottom: 24px;
  padding-top: 16px;
}

.task-main-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

/* Остальные стили аналогичны предыдущей версии, но с использованием CSS переменных */
.time-tracking-section {
  margin-bottom: 24px;
}

.time-tracking-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-color);
}

.time-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-estimate,
.time-tracked {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-estimate label,
.time-tracked label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tracked-time {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.timer-controls {
  display: flex;
  gap: 8px;
}

.timer-controls :deep(.el-button.active) {
  background-color: var(--danger);
  border-color: var(--danger);
}

/* Адаптивность */
@media (max-width: 768px) {
  .time-display {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .tracked-time {
    width: 100%;
    justify-content: space-between;
  }
  
  .property-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .deadline-controls {
    flex-direction: column;
    gap: 8px;
  }
}
</style>