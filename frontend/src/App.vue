<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', label: '대시보드', icon: '📊' },
  { path: '/sprints', label: '스프린트', icon: '🏃' },
  { path: '/tasks', label: '업무 보드', icon: '📋' },
  { path: '/review', label: '주간 리뷰', icon: '📝' },
  { path: '/retro', label: '회고', icon: '💡' },
  { path: '/members', label: '팀원', icon: '👥' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Top Navigation -->
    <nav class="bg-white border-b border-slate-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-2">
            <router-link to="/" class="text-xl font-bold text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">Mini Scrum</router-link>
          </div>
          <div class="flex items-center gap-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="route.path === item.path
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
            >
              <span class="mr-1">{{ item.icon }}</span>
              {{ item.label }}
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
  </div>
</template>
