import { ref, computed } from 'vue'

export function useFilters(tasks) {
  const searchQuery = ref('')
  const statusFilter = ref('all')
  const priorityFilter = ref('all')
  const assigneeFilter = ref('all')
  const tagFilter = ref([])
  const dateRangeFilter = ref([])

  const filteredTasks = computed(() => {
    if (!tasks || !tasks.value) return []
    
    return tasks.value.filter(task => {
      // Поиск по тексту
      const matchesSearch = !searchQuery.value || 
        task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.value.toLowerCase())

      // Фильтр по статусу
      const matchesStatus = statusFilter.value === 'all' || task.columnId === statusFilter.value

      // Фильтр по приоритету
      const matchesPriority = priorityFilter.value === 'all' || task.priority === priorityFilter.value

      // Фильтр по исполнителю
      const matchesAssignee = assigneeFilter.value === 'all' || 
        task.assignee?.id?.toString() === assigneeFilter.value

      // Фильтр по тегам
      const matchesTags = tagFilter.value.length === 0 || 
        (task.tags && tagFilter.value.every(tag => task.tags.includes(tag)))

      // Фильтр по дате
      const matchesDate = dateRangeFilter.value.length === 0 || 
        (task.deadline && isDateInRange(task.deadline, dateRangeFilter.value))

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesTags && matchesDate
    })
  })

  function isDateInRange(date, range) {
    try {
      const taskDate = new Date(date)
      const startDate = new Date(range[0])
      const endDate = new Date(range[1])
      return taskDate >= startDate && taskDate <= endDate
    } catch (error) {
      console.error('Error checking date range:', error)
      return false
    }
  }

  const resetFilters = () => {
    searchQuery.value = ''
    statusFilter.value = 'all'
    priorityFilter.value = 'all'
    assigneeFilter.value = 'all'
    tagFilter.value = []
    dateRangeFilter.value = []
  }

  return {
    searchQuery,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    tagFilter,
    dateRangeFilter,
    filteredTasks,
    resetFilters
  }
}