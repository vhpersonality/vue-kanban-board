<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="project ? 'Редактирование проекта' : 'Новый проект'" 
    width="500"
    @close="handleClose"
  >
    <el-form :model="form" label-width="100px" ref="formRef">
      <el-form-item label="Шаблон" v-if="!project">
        <el-select v-model="form.template" placeholder="Выберите шаблон" @change="handleTemplateChange">
          <el-option label="Произвольный" value="custom" />
          <el-option label="Разработка ПО" value="software" />
          <el-option label="Маркетинг кампания" value="marketing" />
          <el-option label="Простой проект" value="simple" />
        </el-select>
      </el-form-item>

      <el-form-item label="Название" required>
        <el-input 
          v-model="form.name" 
          placeholder="Введите название проекта"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="Описание">
        <el-input 
          v-model="form.description" 
          type="textarea"
          placeholder="Описание проекта"
          :rows="3"
        />
      </el-form-item>

      <el-form-item label="Цвет" v-if="project">
        <color-picker v-model="form.color" />
      </el-form-item>

      <el-form-item label="Члены команды" v-if="project">
        <el-select v-model="form.teamMembers" multiple placeholder="Выберите команду">
          <el-option 
            v-for="member in availableTeamMembers"
            :key="member.id"
            :label="member.name"
            :value="member.id"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="24" :src="member.avatar" />
              <span>{{ member.name }}</span>
              <span style="color: #909399; font-size: 12px;">{{ member.role }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">Отмена</el-button>
      <el-button 
        type="primary" 
        @click="handleSave"
        :disabled="!form.name.trim()"
        :loading="loading"
      >
        {{ project ? 'Сохранить' : 'Создать' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { PROJECT_TEMPLATES } from '../../utils/constants'

const props = defineProps({
  modelValue: Boolean,
  project: Object,
  template: String
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  name: '',
  description: '',
  template: props.template || 'custom',
  color: '#409EFF',
  teamMembers: []
})

const formRef = ref(null)
const loading = ref(false)
const availableTeamMembers = ref([])

// Инициализация формы при открытии диалога
watch(() => props.modelValue, (visible) => {
  if (visible) {
    if (props.project) {
      // Режим редактирования
      form.value = { ...props.project }
    } else {
      // Режим создания
      form.value = {
        name: '',
        description: '',
        template: props.template || 'custom',
        color: '#409EFF',
        teamMembers: []
      }
    }
  }
})

function handleTemplateChange(template) {
  if (template !== 'custom') {
    const templateConfig = PROJECT_TEMPLATES[template]
    form.value.name = templateConfig.name
    form.value.description = templateConfig.description
  }
}

function handleSave() {
  if (!form.value.name.trim()) return

  loading.value = true
  
  // Имитация API вызова
  setTimeout(() => {
    emit('save', { ...form.value })
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