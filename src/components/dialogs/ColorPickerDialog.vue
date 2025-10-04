<template>
  <el-dialog
    v-model="dialogVisible"
    title="Выбор цвета"
    width="400"
    @close="handleClose"
  >
    <div class="color-picker">
      <div class="color-grid">
        <div
          v-for="color in availableColors"
          :key="color"
          class="color-option"
          :style="{ backgroundColor: color }"
          :class="{ selected: selectedColor === color }"
          @click="selectColor(color)"
        >
          <el-icon v-if="selectedColor === color"><Check /></el-icon>
        </div>
      </div>
      
      <div class="custom-color">
        <label>Пользовательский цвет:</label>
        <el-color-picker v-model="customColor" @change="selectCustomColor" />
        <span class="color-value">{{ customColor }}</span>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">Отмена</el-button>
      <el-button type="primary" @click="confirmColor">
        Применить
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Check } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  currentColor: String
})

const emit = defineEmits(['update:modelValue', 'select'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const availableColors = ref([
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
  '#4F46E5', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
])

const selectedColor = ref('#409EFF')
const customColor = ref('')

// Инициализация выбранного цвета
watch(() => props.modelValue, (visible) => {
  if (visible) {
    selectedColor.value = props.currentColor || '#409EFF'
    customColor.value = props.currentColor || ''
  }
})

function selectColor(color) {
  selectedColor.value = color
  customColor.value = color
}

function selectCustomColor(color) {
  if (color) {
    selectedColor.value = color
  }
}

function confirmColor() {
  emit('select', selectedColor.value)
  dialogVisible.value = false
}

function handleClose() {
  dialogVisible.value = false
}
</script>

<style scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: var(--text-primary);
}

.color-option .el-icon {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.custom-color {
  display: flex;
  align-items: center;
  gap: 12px;
}

.custom-color label {
  font-size: 14px;
  color: var(--text-primary);
  min-width: 120px;
}

.color-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: var(--text-muted);
}
</style>