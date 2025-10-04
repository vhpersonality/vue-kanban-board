import { ref, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import { debounceFn } from '../utils/helpers'

export function useOfflineSync() {
  const isOnline = ref(true) // Инициализируем значением по умолчанию
  const pendingActions = ref([])
  const { get, set } = useLocalStorage()

  const syncPendingActions = debounceFn(() => {
    if (isOnline.value && pendingActions.value.length > 0) {
      console.log('Syncing pending actions:', pendingActions.value)
      pendingActions.value = []
    }
  }, 1000)

  const addPendingAction = (action) => {
    pendingActions.value.push({
      ...action,
      timestamp: new Date().toISOString(),
      id: Date.now()
    })
    set('pendingActions', pendingActions.value)
    syncPendingActions()
  }

  const handleOnline = () => {
    isOnline.value = true
    syncPendingActions()
  }

  const handleOffline = () => {
    isOnline.value = false
  }

  onMounted(() => {
    // Инициализируем только после монтирования
    isOnline.value = typeof navigator !== 'undefined' ? navigator.onLine : true
    
    const savedActions = get('pendingActions', [])
    pendingActions.value = savedActions

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  return {
    isOnline,
    pendingActions,
    addPendingAction,
    syncPendingActions
  }
}