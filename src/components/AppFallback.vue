<template>
  <div class="app-fallback">
    <div class="fallback-content">
      <h1>🚀 Kanban Pro</h1>
      <p>Загрузка приложения...</p>
      <div v-if="error" class="error-message">
        <h3>Произошла ошибка</h3>
        <p>{{ error }}</p>
        <el-button type="primary" @click="reloadApp">
          Перезагрузить приложение
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err) => {
  console.error('Error captured in fallback:', err)
  error.value = err.message
  return false
})

const reloadApp = () => {
  window.location.reload()
}
</script>

<style scoped>
.app-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.fallback-content {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 0, 0, 0.3);
}
</style>