import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { pinia } from './stores'
import App from './App.vue'
import './styles/main.css'

// Создаем приложение
const app = createApp(App)

// Сначала Pinia, потом Element Plus
app.use(pinia)
app.use(ElementPlus)

// Глобальная обработка ошибок
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error handler:', err)
  console.error('Error details:', { instance, info })
}

// Отключаем devtools в production
app.config.devtools = false

// Монтируем приложение
app.mount('#app')

console.log('Vue app mounted successfully')