import { ref, watch } from 'vue'

export function useLocalStorage() {
  const get = (key, defaultValue = null) => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error getting localStorage key "${key}":`, error)
      return defaultValue
    }
  }

  const set = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  const remove = (key) => {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return { get, set, remove }
}