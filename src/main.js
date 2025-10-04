import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { pinia } from './stores'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)

// Глобальная обработка ошибок
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error handler:', err, info)
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    component: instance?.$options?.name,
    info
  })
}

// Обработчик ошибок Vue
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Vue warning:', { msg, instance, trace })
}

app.use(ElementPlus)
app.use(pinia)
app.mount('#app')

// Глобальный обработчик ошибок
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})