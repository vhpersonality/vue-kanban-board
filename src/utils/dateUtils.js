// Утилиты для работы с датами
export const formatDate = (dateString) => {
  if (!dateString) return 'Не установлено'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Неверная дата'
    
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Неверная дата'
  }
}

export const getTimeRemaining = (deadline) => {
  if (!deadline) return null
  
  try {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    
    if (isNaN(deadlineDate.getTime())) return null
    
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
  } catch (error) {
    console.error('Error calculating time remaining:', error)
    return null
  }
}

export const isOverdue = (deadline) => {
  if (!deadline) return false
  try {
    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) return false
    return deadlineDate < new Date()
  } catch (error) {
    console.error('Error checking overdue:', error)
    return false
  }
}

export const isDueSoon = (deadline, hours = 24) => {
  if (!deadline) return false
  try {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) return false
    
    const diffHours = (deadlineDate - now) / (1000 * 60 * 60)
    return diffHours > 0 && diffHours <= hours
  } catch (error) {
    console.error('Error checking due soon:', error)
    return false
  }
}

export const formatCommentTime = (dateString) => {
  if (!dateString) return 'Неизвестно'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Неизвестно'
    
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
  } catch (error) {
    console.error('Error formatting comment time:', error)
    return 'Неизвестно'
  }
}

export const getMonthName = (monthIndex) => {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return months[monthIndex] || 'Неизвестно'
}