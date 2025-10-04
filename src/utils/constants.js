export const PRIORITIES = [
  { label: 'Критичный', value: 'critical', color: '#f56c6c', weight: 4 },
  { label: 'Высокий', value: 'high', color: '#e6a23c', weight: 3 },
  { label: 'Средний', value: 'medium', color: '#409eff', weight: 2 },
  { label: 'Низкий', value: 'low', color: '#67c23a', weight: 1 }
]

export const STATUSES = {
  todo: { label: 'Бэклог', color: '#4F46E5', order: 1 },
  inProgress: { label: 'В работе', color: '#E6A23C', order: 2 },
  review: { label: 'Ревью', color: '#409EFF', order: 3 },
  done: { label: 'Готово', color: '#67C23A', order: 4 }
}

export const TAGS = [
  'Frontend', 'Backend', 'Design', 'Bug', 'Feature', 
  'Research', 'Documentation', 'Testing', 'Urgent', 'Enhancement',
  'Mobile', 'Web', 'API', 'Database', 'Security'
]

export const PROJECT_TEMPLATES = {
  software: {
    name: 'Разработка ПО',
    description: 'Шаблон для разработки программного обеспечения',
    columns: [
      { id: 'backlog', title: 'Бэклог', color: '#4F46E5' },
      { id: 'sprint', title: 'Спринт', color: '#8B5CF6' },
      { id: 'development', title: 'В разработке', color: '#E6A23C' },
      { id: 'review', title: 'Ревью', color: '#409EFF' },
      { id: 'testing', title: 'Тестирование', color: '#F59E0B' },
      { id: 'done', title: 'Готово', color: '#67C23A' }
    ]
  },
  marketing: {
    name: 'Маркетинг кампания',
    description: 'Шаблон для маркетинговых кампаний',
    columns: [
      { id: 'ideas', title: 'Идеи', color: '#8B5CF6' },
      { id: 'planning', title: 'Планирование', color: '#06B6D4' },
      { id: 'content', title: 'Создание контента', color: '#E6A23C' },
      { id: 'approval', title: 'Согласование', color: '#409EFF' },
      { id: 'published', title: 'Опубликовано', color: '#67C23A' }
    ]
  },
  simple: {
    name: 'Простой проект',
    description: 'Базовый шаблон с тремя колонками',
    columns: [
      { id: 'todo', title: 'Сделать', color: '#4F46E5' },
      { id: 'inProgress', title: 'В работе', color: '#E6A23C' },
      { id: 'done', title: 'Готово', color: '#67C23A' }
    ]
  }
}

export const AUTOMATION_RULES = [
  {
    id: 1,
    name: 'Автоматическое перемещение просроченных задач',
    condition: { field: 'deadline', operator: 'lt', value: 'now' },
    action: { type: 'moveToColumn', target: 'todo' },
    enabled: true
  },
  {
    id: 2,
    name: 'Уведомление о критических задачах',
    condition: { field: 'priority', operator: 'eq', value: 'critical' },
    action: { type: 'notify', target: ['projectManager'] },
    enabled: true
  }
]

export const KEYBOARD_SHORTCUTS = {
  'ctrl+k': 'Быстрый поиск',
  'ctrl+n': 'Новая задача',
  'ctrl+shift+n': 'Новый проект',
  'escape': 'Закрыть модальные окна',
  'ctrl+enter': 'Отправить комментарий',
  'ctrl+s': 'Сохранить изменения',
  'ctrl+f': 'Поиск по задачам'
}

export const AVAILABLE_COLORS = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
  '#4F46E5', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'
]

export const DATE_FORMATS = {
  short: 'DD.MM.YYYY',
  long: 'DD MMMM YYYY',
  datetime: 'DD.MM.YYYY HH:mm',
  relative: 'relative'
}

export const STORAGE_KEYS = {
  PROJECTS: 'kanban-projects',
  CURRENT_PROJECT: 'kanban-current-project',
  USER_PREFERENCES: 'kanban-user-preferences',
  TEAM_MEMBERS: 'kanban-team-members'
}