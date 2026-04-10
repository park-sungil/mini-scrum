<script setup>
import { computed } from 'vue'
import { store } from '../store'

const today = new Date()
const dateStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
const todayStr = today.toISOString().slice(0, 10)

const currentSprint = computed(() =>
  store.sprints.find(s => s.start_date <= todayStr && s.end_date >= todayStr)
)

const sprintTasks = computed(() =>
  currentSprint.value ? store.tasks.filter(t => t.sprint_id === currentSprint.value.id) : []
)

const taskSummary = computed(() => ({
  total: sprintTasks.value.length,
  todo: sprintTasks.value.filter(t => t.status === 'todo').length,
  in_progress: sprintTasks.value.filter(t => t.status === 'in_progress').length,
  done: sprintTasks.value.filter(t => t.status === 'done').length,
}))

const progressPercent = computed(() =>
  taskSummary.value.total ? Math.round((taskSummary.value.done / taskSummary.value.total) * 100) : 0
)

const memberTasks = computed(() =>
  store.members.map(m => {
    const tasks = sprintTasks.value.filter(t => t.assignee_id === m.id)
    return {
      ...m,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    }
  })
)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="font-display text-4xl" style="color: var(--text)">Dashboard</h1>
      <p class="mt-1 text-sm" style="color: var(--text-muted)">{{ dateStr }}</p>
    </div>

    <div v-if="store.loading" class="text-center py-20" style="color: var(--text-muted)">
      <div class="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-6 animate-in">
      <div class="card p-6" v-if="currentSprint">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wider" style="color: var(--accent)">현재 스프린트</div>
            <h2 class="text-xl font-bold mt-1" style="color: var(--text)">{{ currentSprint.title }}</h2>
          </div>
          <div class="text-right">
            <div class="font-mono text-2xl font-bold" style="color: var(--accent)">{{ progressPercent }}%</div>
            <div class="text-xs" style="color: var(--text-muted)">완료율</div>
          </div>
        </div>
        <div class="w-full h-2 rounded-full overflow-hidden" style="background: var(--border)">
          <div class="h-full rounded-full transition-all duration-700 ease-out" :style="{ width: progressPercent + '%', background: 'var(--accent)' }"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs" style="color: var(--text-muted)">
          <span>{{ currentSprint.start_date }}</span>
          <span>{{ currentSprint.end_date }}</span>
        </div>
      </div>

      <div v-else class="card p-8 text-center">
        <div class="font-display text-2xl mb-2" style="color: var(--text-muted)">No Active Sprint</div>
        <p class="text-sm" style="color: var(--text-muted)">스프린트 메뉴에서 새 스프린트를 생성하세요.</p>
      </div>

      <div v-if="currentSprint" class="grid grid-cols-4 gap-4">
        <div class="card p-5 text-center">
          <div class="font-mono text-3xl font-bold" style="color: var(--text)">{{ taskSummary.total }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider mt-2" style="color: var(--text-muted)">전체</div>
        </div>
        <div class="card p-5 text-center" style="border-left: 3px solid var(--info)">
          <div class="font-mono text-3xl font-bold" style="color: var(--info)">{{ taskSummary.todo }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider mt-2" style="color: var(--text-muted)">할 일</div>
        </div>
        <div class="card p-5 text-center" style="border-left: 3px solid var(--warning)">
          <div class="font-mono text-3xl font-bold" style="color: var(--warning)">{{ taskSummary.in_progress }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider mt-2" style="color: var(--text-muted)">진행 중</div>
        </div>
        <div class="card p-5 text-center" style="border-left: 3px solid var(--success)">
          <div class="font-mono text-3xl font-bold" style="color: var(--success)">{{ taskSummary.done }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider mt-2" style="color: var(--text-muted)">완료</div>
        </div>
      </div>

      <div v-if="memberTasks.length" class="card p-6">
        <h2 class="text-xs font-semibold uppercase tracking-wider mb-4" style="color: var(--text-secondary)">팀원별 현황</h2>
        <div class="space-y-3">
          <div v-for="(member, i) in memberTasks" :key="member.id" class="flex items-center gap-4 py-3 animate-in"
            :style="{ animationDelay: (i * 0.05) + 's', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style="background: var(--sidebar)">
              {{ member.name?.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm" style="color: var(--text)">{{ member.name }}</div>
              <div class="flex gap-1 mt-1.5">
                <div v-for="n in member.todo" :key="'t'+n" class="w-5 h-1.5 rounded-full" style="background: var(--info-light)"></div>
                <div v-for="n in member.in_progress" :key="'p'+n" class="w-5 h-1.5 rounded-full" style="background: var(--warning-light)"></div>
                <div v-for="n in member.done" :key="'d'+n" class="w-5 h-1.5 rounded-full" style="background: var(--success)"></div>
              </div>
            </div>
            <div class="flex gap-4 text-xs font-mono flex-shrink-0">
              <span style="color: var(--info)">{{ member.todo }}</span>
              <span style="color: var(--warning)">{{ member.in_progress }}</span>
              <span style="color: var(--success)">{{ member.done }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
