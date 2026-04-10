import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { loadAll } from './store'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Load all data on startup
loadAll()
