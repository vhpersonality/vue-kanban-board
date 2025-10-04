import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { pinia } from './stores'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(pinia)
app.mount('#app')