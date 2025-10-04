import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage'

export const useProjectsStore = defineStore('projects', () => {
  const { get, set } = useLocalStorage()
  
  // State
  const projects = ref(get('projects', []))
  const currentProject = ref(get('currentProject', null))
  const currentUser = ref(get('currentUser', {
    id: 1,
    name: 'Алексей Иванов',
    avatar: '',
    email: 'alexey@company.com',
    role: 'Frontend Developer'
  }))
  
  const teamMembers = ref(get('teamMembers', [
    { id: 1, name: 'Алексей Иванов', avatar: '', role: 'Frontend Developer', projects: [1] },
    { id: 2, name: 'Мария Петрова', avatar: '', role: 'UI/UX Designer', projects: [1] },
    { id: 3, name: 'Дмитрий Сидоров', avatar: '', role: 'Backend Developer', projects: [1] },
    { id: 4, name: 'Елена Козлова', avatar: '', role: 'Project Manager', projects: [1] }
  ]))

  // Getters
  const currentProjectTasks = computed(() => {
    if (!currentProject.value) return []
    return currentProject.value.columns.flatMap(column => column.tasks)
  })

  const myTasks = computed(() => {
    return projects.value.flatMap(project => 
      project.columns.flatMap(column => 
        column.tasks
          .filter(task => task.assignee?.id === currentUser.value.id)
          .map(task => ({
            ...task,
            projectId: project.id,
            projectName: project.name
          }))
      )
    )
  })

  // Actions
  function setProjects(newProjects) {
    projects.value = newProjects
    set('projects', newProjects)
  }

  function setCurrentProject(project) {
    currentProject.value = project
    set('currentProject', project)
  }

  function addProject(project) {
    const newProject = {
      id: Date.now(),
      ...project,
      columns: project.columns || [
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

  function deleteProject(projectId) {
    projects.value = projects.value.filter(p => p.id !== projectId)
    set('projects', projects.value)
    if (currentProject.value && currentProject.value.id === projectId) {
      setCurrentProject(null)
    }
  }

  function addTaskToColumn(projectId, columnId, task) {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      const column = project.columns.find(col => col.id === columnId)
      if (column) {
        const newTask = {
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...task,
          columnId,
          subtasks: task.subtasks || [],
          checklist: task.checklist || [],
          comments: task.comments || [],
          timeEstimate: task.timeEstimate || { hours: 0, minutes: 0 },
          timeTracked: task.timeTracked || { hours: 0, minutes: 0, seconds: 0 },
          timerRunning: false
        }
        column.tasks.push(newTask)
        set('projects', projects.value)
        if (currentProject.value && currentProject.value.id === projectId) {
          setCurrentProject(project)
        }
        return newTask
      }
    }
  }

  function updateTask(projectId, taskId, updates) {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      for (const column of project.columns) {
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
    }
  }

  function moveTask(projectId, taskId, fromColumnId, toColumnId) {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      const fromColumn = project.columns.find(col => col.id === fromColumnId)
      const toColumn = project.columns.find(col => col.id === toColumnId)
      
      if (fromColumn && toColumn) {
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
  }

  function deleteTask(projectId, taskId) {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      for (const column of project.columns) {
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
    deleteProject,
    addTaskToColumn,
    updateTask,
    moveTask,
    deleteTask
  }
})