<template>
  <div id="app">
    <KanbanBoardSimple />
  </div>
</template>

<script setup>
import { onMounted, onErrorCaptured, ref } from 'vue'
import KanbanBoardSimple from './components/KanbanBoardSimple.vue'

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error('App error captured:', err)
  error.value = err
  return false
})

onMounted(() => {
  console.log('App mounted with simplified component')
})
</script>

<style>
#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>