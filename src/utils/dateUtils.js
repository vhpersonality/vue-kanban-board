// Утилиты для работы с датами
export const formatDate = (dateString) => {
  if (!dateString) return 'Не установлено'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getTimeRemaining = (deadline) => {
  if (!deadline) return null
  
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate - now
  
  if (diff <= 0) {
    return { expired: true, text: 'Просрочено' }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return { expired: false, text: `Осталось: ${days} д. ${hours} ч.` }
  } else if (hours > 0) {
    return { expired: false, text: `Осталось: ${hours} ч. ${minutes} мин.` }
  } else {
    return { expired: false, text: `Осталось: ${minutes} мин.` }
  }
}

export const isOverdue = (deadline) => {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

export const formatCommentTime = (dateString) => {
  if (!dateString) return 'Неизвестно'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays === 1) return 'вчера'
  if (diffDays < 7) return `${diffDays} д. назад`
  
  return formatDate(dateString)
}

export const getMonthName = (monthIndex) => {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return months[monthIndex]
}