import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../views/TaskBoardView.vue'),
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('../views/ReviewView.vue'),
  },
  {
    path: '/retro',
    name: 'Retro',
    component: () => import('../views/RetroView.vue'),
  },
  {
    path: '/members',
    name: 'Members',
    component: () => import('../views/MembersView.vue'),
  },
  {
    path: '/sprints',
    name: 'Sprints',
    component: () => import('../views/SprintsView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
