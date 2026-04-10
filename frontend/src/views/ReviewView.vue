<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const sprints = ref([])
const selectedSprintId = ref(null)
const review = ref(null)
const tasks = ref([])
const loading = ref(true)
const editing = ref(false)

const form = ref({
  incomplete_reason: '',
  blockers: '',
  next_plan: '',
})

onMounted(async () => {
  try {
    sprints.value = await api.getSprints()
    if (sprints.value.length > 0) {
      selectedSprintId.value = sprints.value[0].id
      await loadReviewData()
    }
  } catch (e) {
    console.error('Failed to load:', e)
  } finally {
    loading.value = false
  }
})

async function loadReviewData() {
  if (!selectedSprintId.value) return
  const [reviewData, tasksData] = await Promise.all([
    api.getReviews(selectedSprintId.value),
    api.getTasks(selectedSprintId.value),
  ])
  review.value = reviewData.length > 0 ? reviewData[0] : null
  tasks.value = tasksData

  if (review.value) {
    form.value = {
      incomplete_reason: review.value.incomplete_reason || '',
      blockers: review.value.blockers || '',
      next_plan: review.value.next_plan || '',
    }
  } else {
    form.value = { incomplete_reason: '', blockers: '', next_plan: '' }
  }
}

const completedTasks = () => tasks.value.filter(t => t.status === 'done')
const incompleteTasks = () => tasks.value.filter(t => t.status !== 'done')

const priorityLabels = { high: '높음', medium: '보통', low: '낮음' }
const priorityStyles = {
  high: { background: 'var(--danger-light)', color: 'var(--danger)' },
  medium: { background: 'var(--warning-light)', color: 'var(--warning)' },
  low: { background: 'var(--bg)', color: 'var(--text-muted)' },
}

async function saveReview() {
  const data = {
    sprint_id: selectedSprintId.value,
    ...form.value,
  }
  if (review.value) {
    await api.updateReview(review.value.id, data)
  } else {
    await api.createReview(data)
  }
  editing.value = false
  await loadReviewData()
}

function getCurrentSprint() {
  return sprints.value.find(s => s.id === selectedSprintId.value)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-4xl" style="color: var(--text); font-style: italic">Weekly Review</h1>
        <p class="text-sm mt-1" style="color: var(--text-muted)">주간 리뷰</p>
      </div>
      <select v-model="selectedSprintId" @change="loadReviewData" class="input" style="width: auto">
        <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.title }}</option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--text-muted)">
      <div class="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-5 animate-in">
      <!-- Sprint Goal -->
      <div class="card p-6" style="border-left: 3px solid var(--accent)">
        <div class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--accent)">스프린트 목표</div>
        <p class="text-sm leading-relaxed" style="color: var(--text)">{{ getCurrentSprint()?.goal || '목표가 설정되지 않았습니다.' }}</p>
        <div class="font-mono text-xs mt-2" style="color: var(--text-muted)">
          {{ getCurrentSprint()?.start_date }} ~ {{ getCurrentSprint()?.end_date }}
        </div>
      </div>

      <!-- Two column: completed / incomplete -->
      <div class="grid grid-cols-2 gap-5">
        <!-- Completed -->
        <div class="card p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-2 h-2 rounded-full" style="background: var(--success)"></div>
            <h2 class="text-xs font-bold uppercase tracking-wider" style="color: var(--success)">완료 ({{ completedTasks().length }})</h2>
          </div>
          <div v-if="completedTasks().length === 0" class="text-xs" style="color: var(--text-muted)">완료된 업무가 없습니다.</div>
          <ul class="space-y-2.5">
            <li v-for="task in completedTasks()" :key="task.id" class="relative group">
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 flex-shrink-0" style="color: var(--success)" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span style="color: var(--text)">{{ task.title }}</span>
              </div>
              <div class="text-[11px] ml-6 mt-0.5" style="color: var(--text-muted)">{{ task.assignee_name }}</div>
              <!-- Popover -->
              <div class="hidden group-hover:block absolute left-0 top-full mt-1 z-10 p-4 w-72 rounded-xl" style="background: white; border: 1px solid var(--border); box-shadow: 0 8px 30px rgba(0,0,0,0.1)">
                <div class="text-sm font-semibold mb-1" style="color: var(--text)">{{ task.title }}</div>
                <p v-if="task.description" class="text-xs mb-2" style="color: var(--text-muted)">{{ task.description }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-if="task.assignee_name" class="badge" style="background: var(--bg); color: var(--text-secondary)">{{ task.assignee_name }}</span>
                  <span class="badge" :style="priorityStyles[task.priority]">{{ priorityLabels[task.priority] }}</span>
                  <span v-if="task.due_date" class="badge font-mono" style="background: var(--bg); color: var(--text-muted)">{{ task.due_date }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Incomplete -->
        <div class="card p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-2 h-2 rounded-full" style="background: var(--warning)"></div>
            <h2 class="text-xs font-bold uppercase tracking-wider" style="color: var(--warning)">미완료 ({{ incompleteTasks().length }})</h2>
          </div>
          <div v-if="incompleteTasks().length === 0" class="text-xs" style="color: var(--success)">모든 업무가 완료되었습니다!</div>
          <ul class="space-y-2.5">
            <li v-for="task in incompleteTasks()" :key="task.id" class="relative group">
              <div class="flex items-center gap-2 text-sm">
                <div class="w-4 h-4 rounded-full border-2 flex-shrink-0" style="border-color: var(--warning)"></div>
                <span style="color: var(--text)">{{ task.title }}</span>
                <span class="badge" :style="task.status === 'in_progress' ? { background: 'var(--warning-light)', color: 'var(--warning)' } : { background: 'var(--info-light)', color: 'var(--info)' }">
                  {{ task.status === 'in_progress' ? '진행 중' : '할 일' }}
                </span>
              </div>
              <!-- Popover -->
              <div class="hidden group-hover:block absolute left-0 top-full mt-1 z-10 p-4 w-72 rounded-xl" style="background: white; border: 1px solid var(--border); box-shadow: 0 8px 30px rgba(0,0,0,0.1)">
                <div class="text-sm font-semibold mb-1" style="color: var(--text)">{{ task.title }}</div>
                <p v-if="task.description" class="text-xs mb-2" style="color: var(--text-muted)">{{ task.description }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-if="task.assignee_name" class="badge" style="background: var(--bg); color: var(--text-secondary)">{{ task.assignee_name }}</span>
                  <span class="badge" :style="priorityStyles[task.priority]">{{ priorityLabels[task.priority] }}</span>
                  <span v-if="task.due_date" class="badge font-mono" style="background: var(--bg); color: var(--text-muted)">{{ task.due_date }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Review Content -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-secondary)">리뷰 내용</h2>
          <button
            v-if="!editing"
            @click="editing = true"
            class="btn-ghost" style="padding: 5px 12px"
          >
            {{ review ? '수정' : '작성하기' }}
          </button>
        </div>

        <div v-if="!editing && review" class="space-y-5">
          <div>
            <div class="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color: var(--danger)">미완료 사유</div>
            <p class="text-sm leading-relaxed whitespace-pre-wrap" style="color: var(--text)">{{ review.incomplete_reason || '-' }}</p>
          </div>
          <div style="border-top: 1px solid var(--border); padding-top: 16px">
            <div class="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color: var(--warning)">이슈 / 블로커</div>
            <p class="text-sm leading-relaxed whitespace-pre-wrap" style="color: var(--text)">{{ review.blockers || '-' }}</p>
          </div>
          <div style="border-top: 1px solid var(--border); padding-top: 16px">
            <div class="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color: var(--info)">다음 주 계획</div>
            <p class="text-sm leading-relaxed whitespace-pre-wrap" style="color: var(--text)">{{ review.next_plan || '-' }}</p>
          </div>
        </div>

        <div v-else-if="!editing" class="text-sm" style="color: var(--text-muted)">아직 리뷰가 작성되지 않았습니다.</div>

        <form v-if="editing" @submit.prevent="saveReview" class="space-y-4">
          <div>
            <label class="label" style="color: var(--danger)">미완료 사유</label>
            <textarea v-model="form.incomplete_reason" rows="3" class="input" placeholder="완료하지 못한 업무의 사유를 작성하세요"></textarea>
          </div>
          <div>
            <label class="label" style="color: var(--warning)">이슈 / 블로커</label>
            <textarea v-model="form.blockers" rows="3" class="input" placeholder="진행을 막는 문제가 있다면 작성하세요"></textarea>
          </div>
          <div>
            <label class="label" style="color: var(--info)">다음 주 계획</label>
            <textarea v-model="form.next_plan" rows="3" class="input" placeholder="다음 스프린트에 할 일을 작성하세요"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="editing = false" class="btn-ghost">취소</button>
            <button type="submit" class="btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
