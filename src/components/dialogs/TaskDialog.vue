<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="task ? 'Редактирование задачи' : 'Новая задача'" 
    width="600"
    @close="handleClose"
  >
    <el-form :model="form" label-width="100px" ref="formRef">
      <el-form-item label="Название" required>
        <el-input 
          v-model="form.title" 
          placeholder="Введите название задачи"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="Описание">
        <el-input 
          v-model="form.description" 
          type="textarea"
          placeholder="Описание задачи"
          :rows="3"
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Статус">
            <el-select v-model="form.columnId" placeholder="Выберите статус">
              <el-option 
                v-for="column in availableColumns"
                :key="column.id"
                :label="column.title"
                :value="column.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="Приоритет">
            <el-select v-model="form.priority" placeholder="Выберите приоритет">
              <el-option label="Критичный" value="Критичный" />
              <el-option label="Высокий" value="Высокий" />
              <el-option label="Средний" value="Средний" />
              <el-option label="Низкий" value="Низкий" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Исполнитель">
            <el-select v-model="form.assignee" placeholder="Выберите исполнителя" filterable clearable>
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
                  <span style="color: #909399; font-size: 12px;">{{ member.role }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="Дедлайн">
            <el-date-picker
              v-model="form.deadline"
              type="datetime"
              placeholder="Выберите дату и время"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Теги">
        <el-select 
          v-model="form.tags" 
          multiple 
          filterable 
          allow-create
          placeholder="Добавьте теги"
        >
          <el-option 
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Оценка времени">
        <div class="time-estimate-inputs">
          <el-input-number 
            v-model="form.timeEstimate.hours" 
            :min="0" 
            :max="999" 
            placeholder="Часы"
          />
          <span>ч</span>
          <el-input-number 
            v-model="form.timeEstimate.minutes" 
            :min="0" 
            :max="59" 
            placeholder="Минуты"
          />
          <span>м</span>
        </div>
      </el-form-item>

      <!-- Подзадачи -->
      <el-form-item label="Подзадачи">
        <div class="subtasks-list">
          <div 
            v-for="(subtask, index) in form.subtasks" 
            :key="index"
            class="subtask-item"
          >
            <el-input
              v-model="subtask.title"
              placeholder="Название подзадачи"
              style="flex: 1"
            />
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeSubtask(index)"
            />
          </div>
          <el-button 
            type="primary" 
            :icon="Plus" 
            text 
            @click="addSubtask"
          >
            Добавить подзадачу
          </el-button>
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">Отмена</el-button>
      <el-button 
        type="primary" 
        @click="handleSave"
        :disabled="!form.title.trim()"
        :loading="loading"
      >
        {{ task ? 'Сохранить' : 'Создать' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  task: Object,
  teamMembers: Array,
  availableTags: Array,
  availableColumns: Array,
  columnId: String
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  title: '',
  description: '',
  columnId: '',
  priority: 'Средний',
  assignee: null,
  deadline: '',
  tags: [],
  timeEstimate: { hours: 0, minutes: 0 },
  subtasks: []
})

const formRef = ref(null)
const loading = ref(false)

// Инициализация формы
watch(() => props.modelValue, (visible) => {
  if (visible) {
    if (props.task) {
      // Режим редактирования
      form.value = { ...props.task }
      // Убедимся, что есть все необходимые поля
      if (!form.value.timeEstimate) form.value.timeEstimate = { hours: 0, minutes: 0 }
      if (!form.value.subtasks) form.value.subtasks = []
      if (!form.value.tags) form.value.tags = []
    } else {
      // Режим создания
      form.value = {
        title: '',
        description: '',
        columnId: props.columnId || 'todo',
        priority: 'Средний',
        assignee: null,
        deadline: '',
        tags: [],
        timeEstimate: { hours: 0, minutes: 0 },
        subtasks: []
      }
    }
  }
})

function addSubtask() {
  form.value.subtasks.push({
    id: Date.now() + Math.random(),
    title: '',
    completed: false
  })
}

function removeSubtask(index) {
  form.value.subtasks.splice(index, 1)
}

function handleSave() {
  if (!form.value.title.trim()) return

  loading.value = true
  
  // Фильтруем пустые подзадачи
  const subtasks = form.value.subtasks.filter(st => st.title.trim())
  
  const taskData = {
    ...form.value,
    subtasks,
    updatedAt: new Date().toISOString()
  }

  // Имитация API вызова
  setTimeout(() => {
    emit('save', taskData)
    loading.value = false
    dialogVisible.value = false
  }, 500)
}

function handleClose() {
  dialogVisible.value = false
  if (formRef.value) {
    formRef.value.resetFields()
  }
}
</script>

<style scoped>
.time-estimate-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>