<template>
  <div class="gantt-view">
    <div class="view-container" v-if="currentProject">
      <div class="gantt-header">
        <h3>График проекта: {{ currentProject.name }}</h3>
        <el-button type="primary" :icon="Download">
          Экспорт
        </el-button>
      </div>
      
      <div class="gantt-chart">
        <div class="gantt-timeline">
          <div class="timeline-header">
            <div class="task-column">Задача</div>
            <div class="timeline-column">График</div>
          </div>
          
          <div 
            v-for="task in allTasks" 
            :key="task.id"
            class="gantt-row"
          >
            <div class="task-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <el-tag size="small" :type="getPriorityType(task.priority)">
                  {{ task.priority }}
                </el-tag>
                <span class="assignee" v-if="task.assignee">
                  {{ task.assignee.name }}
                </span>
              </div>
            </div>
            
            <div class="timeline-track">
              <div 
                class="task-bar"
                :class="getTaskBarClass(task)"
                :style="getTaskBarStyle(task)"
                :title="getTaskTooltip(task)"
              >
                <span class="task-bar-label">{{ task.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <el-empty description="Выберите проект для просмотра графика" />
    </div>
  </