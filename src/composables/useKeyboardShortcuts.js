import { onMounted, onUnmounted } from 'vue'

export function useKeyboardShortcuts() {
  const listeners = {}

  const handleKeydown = (event) => {
    const key = event.key.toLowerCase()
    let shortcut = ''

    if (event.ctrlKey || event.metaKey) {
      shortcut += 'ctrl+'
    }
    if (event.shiftKey) {
      shortcut += 'shift+'
    }
    if (event.altKey) {
      shortcut += 'alt+'
    }

    shortcut += key

    if (listeners[shortcut]) {
      event.preventDefault()
      listeners[shortcut]()
    }
  }

  const registerShortcut = (shortcut, callback) => {
    listeners[shortcut] = callback
  }

  const unregisterShortcut = (shortcut) => {
    delete listeners[shortcut]
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return { registerShortcut, unregisterShortcut }
}