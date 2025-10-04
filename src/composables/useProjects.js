import { ref, computed } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useLocalStorage } from './useLocalStorage'

export function useProjects() {
  const store = useProjectsStore()
  const { get, set } = useLocalStorage()

  // Загрузка проектов при инициализации
  const loadProjects = () => {
    const savedProjects = get('projects')
    if (savedProjects && savedProjects.length > 0) {
      store.setProjects(savedProjects)
    }
  }

  // Автосохранение при изменениях
  const autoSave = computed(() => {
    return {
      projects: store.projects,
      currentProject: store.currentProject,
      teamMembers: store.teamMembers
    }
  })

  // Следим за изменениями и сохраняем
  watch(autoSave, (newValue) => {
    set('projects', newValue.projects)
    set('currentProject', newValue.currentProject)
    set('teamMembers', newValue.teamMembers)
  }, { deep: true })

  // Статистика проектов
  const projectsStats = computed(() => {
    return store.projects.map(project => {
      const totalTasks = project.columns.reduce((sum, column) => sum + column.tasks.length, 0)
      const completedTasks = project.columns.find(col => col.id === 'done')?.tasks.length || 0
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        ...project,
        totalTasks,
        completedTasks,
        completionRate
      }
    })
  })

  // Поиск проектов
  const searchProjects = (query) => {
    if (!query) return store.projects
    return store.projects.filter(project =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.description?.toLowerCase().includes(query.toLowerCase())
    )
  }

  // Экспорт проекта
  const exportProject = (projectId) => {
    const project = store.projects.find(p => p.id === projectId)
    if (!project) return null

    const exportData = {
      ...project,
      exportDate: new Date().toISOString(),
      version: '2.0.0'
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `project-${project.name}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return exportData
  }

  // Импорт проекта
  const importProject = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target.result)
          
          // Валидация данных проекта
          if (!projectData.name || !projectData.columns) {
            throw new Error('Invalid project format')
          }

          // Добавляем проект в хранилище
          const newProject = store.addProject(projectData)
          resolve(newProject)
        } catch (error) {
          reject(new Error('Failed to parse project file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  return {
    loadProjects,
    projectsStats,
    searchProjects,
    exportProject,
    importProject
  }
}