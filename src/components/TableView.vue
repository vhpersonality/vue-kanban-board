<template>
  <div class="table-view">
    <div class="table-container" v-if="currentProject">
      <el-table 
        :data="allTasks" 
        style="width: 100%"
        empty-text="Нет задач"
        @row-click="handleRowClick"
      >
        <!-- ... остальные колонки без изменений ... -->
        
        <el-table-column label="Действия" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              circle
              @click.stop="editTask(scope.row)"
            />
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              circle
              @click.stop="deleteTask(scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div v-else class="empty-state">
      <el-empty description="Выберите проект для просмотра задач" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { formatDate, isOverdue } from '../utils/dateUtils'

const props = defineProps({
  projects: Array,
  currentProject: Object
})

const emit = defineEmits(['update-task', 'delete-task', 'open-task']) // ДОБАВЛЕНО: open-task

// ... остальной код без изменений ...

function handleRowClick(task) {
  emit('open-task', task) // ИЗМЕНЕНО: вместо editTask
}

// ... остальные методы без изменений ...
</script>