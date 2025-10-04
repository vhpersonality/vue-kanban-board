<template>
  <div id="app" :class="{ 'dark-theme': isDarkTheme }">
    <KanbanBoard />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import KanbanBoard from './components/KanbanBoard.vue'
import { useTheme } from './composables/useTheme'

const { isDarkTheme } = useTheme()

onMounted(() => {
  console.log('🚀 Kanban Board запущен!')
})
</script>

<style>
#app {
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>