import { debounce, throttle } from 'lodash-es'

export const debounceFn = (fn, delay) => debounce(fn, delay)
export const throttleFn = (fn, delay) => throttle(fn, delay)

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return true
  }
}

export const exportToJSON = (data, filename = 'data.json') => {
  const dataStr = JSON.stringify(data, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const isDueSoon = (deadline, hours = 24) => {
  if (!deadline) return false
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffHours = (deadlineDate - now) / (1000 * 60 * 60)
  return diffHours > 0 && diffHours <= hours
}