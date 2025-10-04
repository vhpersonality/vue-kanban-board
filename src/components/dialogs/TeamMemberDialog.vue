<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="member ? 'Редактирование участника' : 'Новый участник'" 
    width="500"
    @close="handleClose"
  >
    <el-form :model="form" label-width="120px" ref="formRef">
      <el-form-item label="Имя" required>
        <el-input v-model="form.name" placeholder="Введите имя" />
      </el-form-item>
      <el-form-item label="Должность" required>
        <el-input v-model="form.role" placeholder="Введите должность" />
      </el-form-item>
      <el-form-item label="Email">
        <el-input v-model="form.email" placeholder="Введите email" />
      </el-form-item>
      <el-form-item label="Фото">
        <el-input v-model="form.avatar" placeholder="URL фото" />
      </el-form-item>
      <el-form-item label="Проекты">
        <el-select v-model="form.projects" multiple placeholder="Выберите проекты">
          <el-option 
            v-for="project in projects" 
            :key="project.id"
            :label="project.name" 
            :value="project.id" 
          />
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">Отмена</el-button>
      <el-button 
        type="primary" 
        @click="handleSave"
        :disabled="!form.name.trim() || !form.role.trim()"
        :loading="loading"
      >
        {{ member ? 'Сохранить' : 'Создать' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  member: Object,
  projects: Array
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  name: '',
  role: '',
  email: '',
  avatar: '',
  projects: []
})

const formRef = ref(null)
const loading = ref(false)

// Инициализация формы
watch(() => props.modelValue, (visible) => {
  if (visible) {
    if (props.member) {
      // Режим редактирования
      form.value = { ...props.member }
    } else {
      // Режим создания
      form.value = {
        name: '',
        role: '',
        email: '',
        avatar: '',
        projects: []
      }
    }
  }
})

function handleSave() {
  if (!form.value.name.trim() || !form.value.role.trim()) return

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