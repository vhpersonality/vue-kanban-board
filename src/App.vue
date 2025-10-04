<template>
  <div id="app">
    <KanbanBoard />
  </div>
</template>

<script setup>
import { onMounted, onErrorCaptured, ref } from 'vue'
import KanbanBoard from './components/KanbanBoard.vue'

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error('App error captured:', err)
  console.error('Error details:', { instance, info })
  error.value = err
  return false
})

onMounted(() => {
  console.log('App mounted')
})
</script>

<style>
#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Базовые стили для предотвращения FOUC */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>