import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage'

export const useProjectsStore = defineStore('projects', () => {
  const { get, set } = useLocalStorage()
  
  // Инициализируем с проверками
  const projects = ref([])
  const currentProject = ref(null)
  const currentUser = ref({
    id: 1,
    name: 'Алексей Иванов',
    avatar: '',
    email: 'alexey@company.com',
    role: 'Frontend Developer'
  })
  
  const teamMembers = ref([
    { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer', projects: [1] },
    { id: 2, name: 'Мария Петрова', avatar: '', role: 'UI/UX Designer', projects: [1] },
    { id: 3, name: 'Дмитрий Сидоров', avatar: '', role: 'Backend Developer', projects: [1] },
    { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager', projects: [1] }
  ])

  // Инициализация после создания store
  const initializeStore = () => {
    try {
      const savedProjects = get('projects', [])
      const savedCurrentProject = get('currentProject', null)
      const savedCurrentUser = get('currentUser', currentUser.value)
      const savedTeamMembers = get('teamMembers', teamMembers.value)

      projects.value = Array.isArray(savedProjects) ? savedProjects : []
      currentProject.value = savedCurrentProject
      currentUser.value = savedCurrentUser
      teamMembers.value = Array.isArray(savedTeamMembers) ? savedTeamMembers : teamMembers.value
    } catch (error) {
      console.error('Error initializing store:', error)
      // Используем значения по умолчанию при ошибке
      projects.value = []
      currentProject.value = null
    }
  }

  // Вызываем инициализацию
  initializeStore()

  const currentProjectTasks = computed(() => {
    if (!currentProject.value || !currentProject.value.columns) return []
    return currentProject.value.columns.flatMap(column => 
      Array.isArray(column.tasks) ? column.tasks : []
    )
  })

  const myTasks = computed(() => {
    if (!Array.isArray(projects.value)) return []
    
    return projects.value.flatMap(project => {
      if (!project.columns || !Array.isArray(project.columns)) return []
      
      return project.columns.flatMap(column => {
        if (!Array.isArray(column.tasks)) return []
        
        return column.tasks
          .filter(task => task.assignee?.id === currentUser.value.id)
          .map(task => ({
            ...task,
            projectId: project.id,
            projectName: project.name
          }))
      })
    })
  })

  function setProjects(newProjects) {
    if (!Array.isArray(newProjects)) {
      console.error('setProjects: newProjects is not an array')
      return
    }
    projects.value = newProjects
    set('projects', newProjects)
  }

  function setCurrentProject(project) {
    currentProject.value = project
    set('currentProject', project)
  }

  function addProject(project) {
    if (!project || typeof project !== 'object') {
      console.error('addProject: invalid project data')
      return null
    }

    const newProject = {
      id: Date.now(),
      name: project.name || 'Новый проект',
      description: project.description || '',
      columns: Array.isArray(project.columns) ? project.columns : [
        { id: 'todo', title: 'Бэклог', color: '#4F46E5', editing: false, tasks: [] },
        { id: 'inProgress', title: 'В работе', color: '#E6A23C', editing: false, tasks: [] },
        { id: 'review', title: 'Ревью', color: '#409EFF', editing: false, tasks: [] },
        { id: 'done', title: 'Готово', color: '#67C23A', editing: false, tasks: [] }
      ]
    }
    
    projects.value.push(newProject)
    set('projects', projects.value)
    return newProject
  }

  function updateProject(projectId, updates) {
    const projectIndex = projects.value.findIndex(p => p.id === projectId)
    if (projectIndex !== -1) {
      projects.value[projectIndex] = { ...projects.value[projectIndex], ...updates }
      set('projects', projects.value)
      if (currentProject.value && currentProject.value.id === projectId) {
        setCurrentProject(projects.value[projectIndex])
      }
    }
  }

  function addTaskToColumn(projectId, columnId, task) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project || !project.columns) return null

    const column = project.columns.find(col => col.id === columnId)
    if (!column) return null

    const newTask = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: task.title || 'Новая задача',
      description: task.description || '',
      priority: task.priority || 'Средний',
      columnId: columnId,
      assignee: task.assignee || null,
      deadline: task.deadline || '',
      tags: Array.isArray(task.tags) ? task.tags : [],
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
      checklist: Array.isArray(task.checklist) ? task.checklist : [],
      comments: Array.isArray(task.comments) ? task.comments : [],
      timeEstimate: task.timeEstimate || { hours: 0, minutes: 0 },
      timeTracked: task.timeTracked || { hours: 0, minutes: 0, seconds: 0 },
      timerRunning: false
    }

    if (!Array.isArray(column.tasks)) {
      column.tasks = []
    }
    
    column.tasks.push(newTask)
    set('projects', projects.value)
    
    if (currentProject.value && currentProject.value.id === projectId) {
      setCurrentProject(project)
    }
    
    return newTask
  }

  function updateTask(projectId, taskId, updates) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project || !project.columns) return null

    for (const column of project.columns) {
      if (!Array.isArray(column.tasks)) continue
      
      const taskIndex = column.tasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        column.tasks[taskIndex] = { 
          ...column.tasks[taskIndex], 
          ...updates, 
          updatedAt: new Date().toISOString() 
        }
        set('projects', projects.value)
        
        if (currentProject.value && currentProject.value.id === projectId) {
          setCurrentProject(project)
        }
        
        return column.tasks[taskIndex]
      }
    }
    return null
  }

  function moveTask(projectId, taskId, fromColumnId, toColumnId) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project || !project.columns) return

    const fromColumn = project.columns.find(col => col.id === fromColumnId)
    const toColumn = project.columns.find(col => col.id === toColumnId)
    
    if (fromColumn && toColumn && Array.isArray(fromColumn.tasks) && Array.isArray(toColumn.tasks)) {
      const taskIndex = fromColumn.tasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        const task = fromColumn.tasks[taskIndex]
        fromColumn.tasks.splice(taskIndex, 1)
        toColumn.tasks.push({ ...task, columnId: toColumnId })
        set('projects', projects.value)
        
        if (currentProject.value && currentProject.value.id === projectId) {
          setCurrentProject(project)
        }
      }
    }
  }

  function deleteTask(projectId, taskId) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project || !project.columns) return

    for (const column of project.columns) {
      if (!Array.isArray(column.tasks)) continue
      
      const taskIndex = column.tasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        column.tasks.splice(taskIndex, 1)
        set('projects', projects.value)
        
        if (currentProject.value && currentProject.value.id === projectId) {
          setCurrentProject(project)
        }
        return
      }
    }
  }

  return {
    projects,
    currentProject,
    currentUser,
    teamMembers,
    currentProjectTasks,
    myTasks,
    setProjects,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject: (projectId) => {
      projects.value = projects.value.filter(p => p.id !== projectId)
      set('projects', projects.value)
      if (currentProject.value && currentProject.value.id === projectId) {
        setCurrentProject(null)
      }
    },
    addTaskToColumn,
    updateTask,
    moveTask,
    deleteTask
  }
})