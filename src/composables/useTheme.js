import { ref, onMounted, watch } from 'vue'
import { useLocalStorage } from './useLocalStorage'

export function useTheme() {
  const { get, set } = useLocalStorage()
  const isDarkTheme = ref(get('darkTheme', false))

  const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value
    set('darkTheme', isDarkTheme.value)
    applyTheme()
  }

  const applyTheme = () => {
    if (isDarkTheme.value) {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  }

  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    isDarkTheme.value = get('darkTheme', mediaQuery.matches)
    applyTheme()

    mediaQuery.addEventListener('change', (e) => {
      if (!get('darkTheme')) {
        isDarkTheme.value = e.matches
        applyTheme()
      }
    })
  })

  watch(isDarkTheme, applyTheme)

  return {
    isDarkTheme,
    toggleTheme
  }
}