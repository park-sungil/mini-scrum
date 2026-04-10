<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/', label: '대시보드', svg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { path: '/sprints', label: '스프린트', svg: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/tasks', label: '업무 보드', svg: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { path: '/review', label: '주간 리뷰', svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/retro', label: '회고', svg: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { path: '/members', label: '팀원', svg: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V21' },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex min-h-screen" style="background: var(--bg)">
    <!-- Sidebar -->
    <aside class="w-[220px] flex-shrink-0 flex flex-col fixed h-screen" style="background: var(--sidebar)">
      <!-- Logo -->
      <router-link to="/" class="block px-6 py-6 group">
        <div class="font-display text-2xl text-white/90 group-hover:text-white transition-colors" style="">
          Mini Scrum
        </div>
        <div class="text-[10px] uppercase tracking-[3px] mt-0.5" style="color: var(--accent)">
          Workspace
        </div>
      </router-link>

      <!-- Divider -->
      <div class="mx-4 border-t border-white/10"></div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150"
          :class="isActive(item.path)
            ? 'text-white'
            : 'text-white/50 hover:text-white/80'"
          :style="isActive(item.path) ? 'background: var(--sidebar-active)' : ''"
        >
          <svg class="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.svg" />
          </svg>
          {{ item.label }}
          <div
            v-if="isActive(item.path)"
            class="ml-auto w-1.5 h-1.5 rounded-full"
            style="background: var(--accent)"
          ></div>
        </router-link>
      </nav>

      <!-- Footer -->
      <div class="px-4 py-4 border-t border-white/10">
        <div class="text-[11px] text-white/30">
          v1.0 &middot; Agile Workspace
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="ml-[220px] flex-1 min-h-screen">
      <div class="max-w-[1100px] mx-auto px-8 py-8">
        <router-view />
      </div>
    </main>
  </div>
</template>
