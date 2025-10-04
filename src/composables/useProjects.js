import { ref, computed } from 'vue'
import { useProjectsStore } from '../stores/projects'

export function useProjects() {
  const store = useProjectsStore()

  // Аналитика проектов
  const projectMetrics = computed(() => {
    return store.projects.map(project => {
      const totalTasks = project.columns.reduce((sum, column) => sum + column.tasks.length, 0)
      const completedTasks = project.columns.find(col => col.id === 'done')?.tasks.length || 0
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        ...project,
        totalTasks,
        completedTasks,
        completionRate,
        teamMembers: store.teamMembers.filter(member => 
          member.projects?.includes(project.id)
        )
      }
    })
  })

  // Продуктивность команды
  const teamProductivity = computed(() => {
    return store.teamMembers.map(member => {
      const memberTasks = store.myTasks.value.filter(task => 
        task.assignee?.id === member.id
      )
      
      const completedTasks = memberTasks.filter(task => task.columnId === 'done').length
      const completionRate = memberTasks.length > 0 ? 
        Math.round((completedTasks / memberTasks.length) * 100) : 0

      return {
        ...member,
        taskCount: memberTasks.length,
        completedTasks,
        completionRate,
        projects: member.projects?.map(projectId => 
          store.projects.find(p => p.id === projectId)?.name
        ).filter(Boolean) || []
      }
    })
  })

  // Тренды продуктивности
  const productivityTrends = computed(() => {
    const trends = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const dateStr = date.toISOString().split('T')[0]
      
      const dailyCompleted = store.projects.flatMap(project =>
        project.columns.flatMap(column =>
          column.tasks.filter(task => {
            if (task.columnId !== 'done') return false
            const taskDate = new Date(task.updatedAt).toISOString().split('T')[0]
            return taskDate === dateStr
          })
        )
      ).length
      
      trends.push({
        date: dateStr,
        completed: dailyCompleted,
        created: 0 // Можно добавить логику для созданных задач
      })
    }
    
    return trends
  })

  return {
    projectMetrics,
    teamProductivity,
    productivityTrends
  }
}   