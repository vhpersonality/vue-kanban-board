import { createPinia } from 'pinia'

// Создаем и экспортируем pinia
export const pinia = createPinia()

// Настраиваем pinia
pinia.use(({ store }) => {
  // Добавляем логирование для отладки
  store.$onAction(({ name, store, args, after, onError }) => {
    console.log(`Store action: ${name}`, args)
    
    after((result) => {
      console.log(`Store action ${name} completed`)
    })
    
    onError((error) => {
      console.error(`Store action ${name} failed:`, error)
    })
  })
})