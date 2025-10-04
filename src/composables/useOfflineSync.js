import { ref, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from './useLocalStorage'

export function useOfflineSync() {
  const isOnline = ref(navigator.onLine)
  const pendingActions = ref([])
  const { get, set } = useLocalStorage()

  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
    if (isOnline.value) {
      syncPendingActions()
    }
  }

  const addPendingAction = (action) => {
    pendingActions.value.push({
      ...action,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    })
    set('pendingActions', pendingActions.value)
  }

  const syncPendingActions = async () => {
    if (pendingActions.value.length === 0) return

    // Имитация синхронизации с сервером
    for (const action of pendingActions.value) {
      try {
        console.log('Syncing action:', action)
        // Здесь бы был реальный API вызов
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Failed to sync action:', error)
        break
      }
    }

    // Очищаем выполненные действия
    pendingActions.value = []
    set('pendingActions', [])
  }

  const retryFailedActions = () => {
    syncPendingActions()
  }

  onMounted(() => {
    // Загружаем ожидающие действия из localStorage
    const savedActions = get('pendingActions', [])
    pendingActions.value = savedActions

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Периодическая синхронизация
    const syncInterval = setInterval(() => {
      if (isOnline.value && pendingActions.value.length > 0) {
        syncPendingActions()
      }
    }, 30000) // Каждые 30 секунд

    onUnmounted(() => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(syncInterval)
    })
  })

  return {
    isOnline,
    pendingActions,
    addPendingAction,
    retryFailedActions,
    syncPendingActions
  }
}