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
  error.value = err
  return false
})

onMounted(() => {
  console.log('App mounted with intermediate KanbanBoard')
})
</script>

<style>
#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>