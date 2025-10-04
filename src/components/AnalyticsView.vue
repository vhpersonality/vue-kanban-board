<template>
  <div class="analytics-view">
    <div class="view-container" v-if="currentProject">
      <div class="analytics-header">
        <h2>Аналитика проекта: {{ currentProject.name }}</h2>
        <div class="analytics-controls">
          <el-button-group>
            <el-button :icon="ArrowLeft" @click="changeTimeRange(-1)" />
            <el-button>{{ getCurrentTimeRange() }}</el-button>
            <el-button :icon="ArrowRight" @click="changeTimeRange(1)" />
          </el-button-group>
          <el-button type="primary" :icon="Download" @click="exportAnalytics">
            Экспорт
          </el-button>
        </div>
      </div>

      <div class="metrics-grid">
        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <span>Общая статистика</span>
            </div>
          </template>
          <div class="metric-content">
            <div class="metric-item">
              <span class="metric-label">Всего задач</span>
              <span class="metric-value">{{ totalTasks }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Выполнено</span>
              <span class="metric-value">{{ completedTasks }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Прогресс</span>
              <el-progress 
                :percentage="completionRate" 
                :color="completionColor"
                :show-text="false"
              />
              <span class="metric-value">{{ completionRate }}%</span>
            </div>
          </div>
        </el-card>

        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <span>Распределение по статусам</span>
            </div>
          </template>
          <div class="status-chart">
            <div 
              v-for="status in statusDistribution" 
              :key="status.name"
              class="status-item"
            >
              <div class="status-bar">
                <div 
                  class="status-fill" 
                  :style="{ 
                    width: `${status.percentage}%`,
                    backgroundColor: status.color
                  }"
                ></div>
              </div>
              <div class="status-info">
                <span class="status-name">{{ status.name }}</span>
                <span class="status-count">{{ status.count }}</span>
                <span class="status-percentage">{{ status.percentage }}%</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <span>Загрузка команды</span>
            </div>
          </template>
          <div class="team-workload">
            <div 
              v-for="member in teamWorkload" 
              :key="member.id"
              class="workload-item"
            >
              <div class="member-info">
                <el-avatar :size="32" :src="member.avatar" />
                <div class="member-details">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-role">{{ member.role }}</span>
                </div>
              </div>
              <div class="workload-stats">
                <span class="task-count">{{ member.taskCount }} задач</span>
                <el-progress 
                  :percentage="member.workloadPercentage" 
                  :status="getWorkloadStatus(member.workloadPercentage)"
                />
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="metric-card full-width">
          <template #header>
            <div class="metric-header">
              <span>Продуктивность по дням</span>
            </div>
          </template>
          <div class="productivity-chart">
            <div 
              v-for="day in productivityData" 
              :key="day.date"
              class="productivity-day"
            >
              <div class="day-label">{{ day.label }}</div>
              <div class="day-bar">
                <div 
                  class="completed-bar" 
                  :style="{ height: `${day.completedPercentage}%` }"
                  :title="`Выполнено: ${day.completed}`"
                ></div>
                <div 
                  class="created-bar" 
                  :style="{ height: `${day.createdPercentage}%` }"
                  :title="`Создано: ${day.created}`"
                ></div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <el-empty description="Выберите проект для просмотра аналитики" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Download, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useProjectsStore } from '../stores/projects'

const store = useProjectsStore()

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const currentProject = computed(() => store.currentProject)

const totalTasks = computed(() => {
  if (!currentProject.value) return 0
  return currentProject.value.columns.reduce((total, column) => total + column.tasks.length, 0)
})

const completedTasks = computed(() => {
  if (!currentProject.value) return 0
  const doneColumn = currentProject.value.columns.find(col => col.id === 'done')
  return doneColumn ? doneColumn.tasks.length : 0
})

const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

const completionColor = computed(() => {
  if (completionRate.value >= 80) return '#67C23A'
  if (completionRate.value >= 50) return '#E6A23C'
  return '#F56C6C'
})

const statusDistribution = computed(() => {
  if (!currentProject.value) return []
  
  return currentProject.value.columns.map(column => {
    const percentage = totalTasks.value > 0 ? 
      Math.round((column.tasks.length / totalTasks.value) * 100) : 0
    
    return {
      name: column.title,
      count: column.tasks.length,
      percentage,
      color: column.color
    }
  })
})

const teamWorkload = computed(() => {
  return store.teamMembers.map(member => {
    const taskCount = store.myTasks.value.filter(task => 
      task.assignee?.id === member.id && 
      task.projectId === currentProject.value?.id
    ).length
    
    const workloadPercentage = Math.min(taskCount * 10, 100) // Простая формула
    
    return {
      ...member,
      taskCount,
      workloadPercentage
    }
  })
})

const productivityData = computed(() => {
  // Генерируем тестовые данные за последние 7 дней
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    days.push({
      date: date.toISOString(),
      label: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      completed: Math.floor(Math.random() * 10),
      created: Math.floor(Math.random() * 8)
    })
  }
  
  // Нормализуем данные для отображения
  const maxValue = Math.max(...days.map(d => Math.max(d.completed, d.created)))
  
  return days.map(day => ({
    ...day,
    completedPercentage: (day.completed / maxValue) * 100,
    createdPercentage: (day.created / maxValue) * 100
  }))
})

function getWorkloadStatus(percentage) {
  if (percentage >= 80) return 'exception'
  if (percentage >= 60) return 'warning'
  return 'success'
}

function getCurrentTimeRange() {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return `${months[currentMonth.value]} ${currentYear.value}`
}

function changeTimeRange(direction) {
  currentMonth.value += direction
  if (currentMonth.value > 11) {
    currentMonth.value = 0
    currentYear.value++
  } else if (currentMonth.value < 0) {
    currentMonth.value = 11
    currentYear.value--
  }
}

function exportAnalytics() {
  const analyticsData = {
    project: currentProject.value?.name,
    period: getCurrentTimeRange(),
    metrics: {
      totalTasks: totalTasks.value,
      completedTasks: completedTasks.value,
      completionRate: completionRate.value,
      statusDistribution: statusDistribution.value,
      teamWorkload: teamWorkload.value
    }
  }
  
  const dataStr = JSON.stringify(analyticsData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `analytics-${currentProject.value?.name}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.analytics-view {
  height: 100%;
  padding: 20px;
  background: var(--bg-primary);
}

.view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.analytics-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.analytics-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.metrics-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  overflow-y: auto;
}

.metric-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.metric-card.full-width {
  grid-column: 1 / -1;
}

.metric-header {
  font-weight: 600;
  color: var(--text-primary);
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.metric-value {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.status-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.status-name {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 60px;
}

.status-count {
  font-weight: 600;
  font-size: 12px;
}

.status-percentage {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 30px;
}

.team-workload {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workload-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.member-details {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 500;
  font-size: 14px;
}

.member-role {
  font-size: 12px;
  color: var(--text-muted);
}

.workload-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  min-width: 120px;
}

.task-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.productivity-chart {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  height: 200px;
  padding: 20px 0;
}

.productivity-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.day-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.day-bar {
  position: relative;
  width: 20px;
  height: 150px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.completed-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--success);
  transition: height 0.3s ease;
}

.created-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--primary);
  transition: height 0.3s ease;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .analytics-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .analytics-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>