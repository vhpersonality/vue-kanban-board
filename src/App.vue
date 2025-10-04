<template>
  <div id="app" :class="{ 'dark-theme': isDarkTheme }">
    <Suspense>
      <template #default>
        <KanbanBoard />
      </template>
      <template #fallback>
        <AppFallback />
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { onMounted, onErrorCaptured, ref } from 'vue'
import KanbanBoard from './components/KanbanBoard.vue'
import AppFallback from './components/AppFallback.vue'
import { useTheme } from './composables/useTheme'

const { isDarkTheme } = useTheme()
const error = ref(null)

onErrorCaptured((err) => {
  console.error('App error captured:', err)
  error.value = err
  return false
})

onMounted(() => {
  console.log('App mounted successfully')
})
</script>

<style>
#app {
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Добавляем базовые стили для предотвращения FOUC */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>