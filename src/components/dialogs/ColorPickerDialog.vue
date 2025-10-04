<template>
  <el-dialog
    v-model="dialogVisible"
    title="Выбор цвета"
    width="400px"
    @close="handleClose"
  >
    <div class="color-picker">
      <div
        v-for="color in availableColors"
        :key="color"
        class="color-option"
        :style="{ backgroundColor: color }"
        @click="selectColor(color)"
      >
        <el-icon v-if="color === selectedColor" class="check-icon">
          <Check />
        </el-icon>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">Отмена</el-button>
      <el-button type="primary" @click="confirmColor">Выбрать</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
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

const selectedColor = ref(props.currentColor || '#409EFF')
const availableColors = ref([
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
  '#4F46E5', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'
])

watch(() => props.currentColor, (newColor) => {
  selectedColor.value = newColor
})

function selectColor(color) {
  selectedColor.value = color
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
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 16px 0;
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

.check-icon {
  color: white;
  font-size: 18px;
}
</style>