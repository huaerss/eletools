import { createRouter, createWebHashHistory } from 'vue-router'
import Versions from './components/Versions.vue'
import Settings from './components/Settings.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: Versions
        },
        {
            path: '/settings',
            component: Settings
        }
    ]
})

export default router
