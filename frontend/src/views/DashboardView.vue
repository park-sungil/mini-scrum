<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api'

const dashboard = ref(null)
const loading = ref(true)

const today = new Date()
const dateStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

const progressPercent = computed(() => {
  if (!dashboard.value?.taskSummary?.total) return 0
  return Math.round((dashboard.value.taskSummary.done / dashboard.value.taskSummary.total) * 100)
})

onMounted(async () => {
  try {
    dashboard.value = await api.getDashboard()
  } catch (e) {
    console.error('Failed to load dashboard:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="font-display text-4xl" style="color: var(--text); font-style: italic">
        Dashboard
      </h1>
      <p class="mt-1 text-sm" style="color: var(--text-muted)">{{ dateStr }}</p>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--text-muted)">
      <div class="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="dashboard" class="space-y-6 animate-in">
      <!-- Sprint Info Bar -->
      <div class="card p-6" v-if="dashboard.currentSprint">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wider" style="color: var(--accent)">현재 스프린트</div>
            <h2 class="text-xl font-bold mt-1" style="color: var(--text)">{{ dashboard.currentSprint.title }}</h2>
          </div>
          <div class="text-right">
            <div class="font-mono text-2xl font-bold" style="color: var(--accent)">{{ progressPercent }}%</div>
            <div class="text-xs" style="color: var(--text-muted)">완료율</div>
          </div>
        </div>
        <!-- Progress bar -->
        <div class="w-full h-2 rounded-full overflow-hidden" style="background: var(--border)">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :style="{ width: progressPercent + '%', background: 'var(--accent)' }"
          ></div>
        </div>
        <div class="flex justify-between mt-2 text-xs" style="color: var(--text-muted)">
          <span>{{ dashboard.currentSprint.start_date }}</span>
          <span>{{ dashboard.currentSprint.end_date }}</span>
        </div>
      </div>

      <div v-else class="card p-8 text-center">
        <div class="font-display text-2xl mb-2" style="color: var(--text-muted); font-style: italic">No Active Sprint</div>
        <p class="text-sm" style="color: var(--text-muted)">스프린트 메뉴에서 새 스프린트를 생성하세요.</p>
      </div>

      <!-- Stats Grid -->
      <div v-if="dashboard.currentSprint" class="grid grid-cols-4 gap-4">
        <div class="card p-5 text-center">
          <div class="font-mono text-3xl font-bold" style="color: var(--text)">{{ dashboard.taskSummary?.total || 0 }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider mt-2" style="color: var(--text-muted)">전체</div>
        </div>
        <div class="card p-5 text-center" style="border-left: 3px solid var(--info)">
          <div class="font-mono text-3xl font-bold" style="color: var(--info)">{{ dashboard.taskSummary?.todo || 0 }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider mt-2" style="color: var(--text-muted)">할 일</div>
        </div>
        <div class="card p-5 text-center" style="border-left: 3px solid var(--warning)">
          <div class="font-mono text-3xl font-bold" style="color: var(--warning)">{{ dashboard.taskSummary?.in_progress || 0 }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider mt-2" style="color: var(--text-muted)">진행 중</div>
        </div>
        <div class="card p-5 text-center" style="border-left: 3px solid var(--success)">
          <div class="font-mono text-3xl font-bold" style="color: var(--success)">{{ dashboard.taskSummary?.done || 0 }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider mt-2" style="color: var(--text-muted)">완료</div>
        </div>
      </div>

      <!-- Member Tasks -->
      <div v-if="dashboard.memberTasks?.length" class="card p-6">
        <h2 class="text-xs font-semibold uppercase tracking-wider mb-4" style="color: var(--text-secondary)">팀원별 현황</h2>
        <div class="space-y-3">
          <div
            v-for="(member, i) in dashboard.memberTasks"
            :key="member.id"
            class="flex items-center gap-4 py-3 animate-in"
            :style="{ animationDelay: (i * 0.05) + 's', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }"
          >
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style="background: var(--sidebar)">
              {{ member.name?.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm" style="color: var(--text)">{{ member.name }}</div>
              <!-- Mini progress bar -->
              <div class="flex gap-1 mt-1.5">
                <div
                  v-for="n in (member.todo || 0)" :key="'t'+n"
                  class="w-5 h-1.5 rounded-full" style="background: var(--info-light)"
                ></div>
                <div
                  v-for="n in (member.in_progress || 0)" :key="'p'+n"
                  class="w-5 h-1.5 rounded-full" style="background: var(--warning-light)"
                ></div>
                <div
                  v-for="n in (member.done || 0)" :key="'d'+n"
                  class="w-5 h-1.5 rounded-full" style="background: var(--success)"
                ></div>
              </div>
            </div>
            <div class="flex gap-4 text-xs font-mono flex-shrink-0">
              <span style="color: var(--info)">{{ member.todo || 0 }}</span>
              <span style="color: var(--warning)">{{ member.in_progress || 0 }}</span>
              <span style="color: var(--success)">{{ member.done || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20" style="color: var(--text-muted)">
      서버 연결을 확인하세요.
    </div>
  </div>
</template>
