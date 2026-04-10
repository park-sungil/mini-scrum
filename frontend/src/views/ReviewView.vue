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
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">주간 리뷰</h1>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedSprintId"
          @change="loadReviewData"
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">로딩 중...</div>

    <div v-else class="space-y-6">
      <!-- Sprint Goal -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-slate-800 mb-2">스프린트 목표</h2>
        <p class="text-slate-600">{{ getCurrentSprint()?.goal || '목표가 설정되지 않았습니다.' }}</p>
        <div class="mt-2 text-sm text-slate-400">
          {{ getCurrentSprint()?.start_date }} ~ {{ getCurrentSprint()?.end_date }}
        </div>
      </div>

      <!-- Completed Tasks -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-green-700 mb-3">완료한 업무 ({{ completedTasks().length }})</h2>
        <div v-if="completedTasks().length === 0" class="text-slate-400 text-sm">완료된 업무가 없습니다.</div>
        <ul class="space-y-2">
          <li v-for="task in completedTasks()" :key="task.id" class="flex items-center gap-2 text-sm">
            <span class="text-green-500">✓</span>
            <span class="text-slate-700">{{ task.title }}</span>
            <span v-if="task.assignee_name" class="text-slate-400">- {{ task.assignee_name }}</span>
          </li>
        </ul>
      </div>

      <!-- Incomplete Tasks -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-amber-700 mb-3">미완료 업무 ({{ incompleteTasks().length }})</h2>
        <div v-if="incompleteTasks().length === 0" class="text-slate-400 text-sm">모든 업무가 완료되었습니다!</div>
        <ul class="space-y-2">
          <li v-for="task in incompleteTasks()" :key="task.id" class="flex items-center gap-2 text-sm">
            <span class="text-amber-500">○</span>
            <span class="text-slate-700">{{ task.title }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full"
              :class="task.status === 'in_progress' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'">
              {{ task.status === 'in_progress' ? '진행 중' : '할 일' }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Review Form -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-slate-800">리뷰 내용</h2>
          <button
            v-if="!editing"
            @click="editing = true"
            class="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {{ review ? '수정' : '작성하기' }}
          </button>
        </div>

        <div v-if="!editing && review" class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">미완료 사유</h3>
            <p class="text-slate-700 whitespace-pre-wrap">{{ review.incomplete_reason || '-' }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">이슈 / 블로커</h3>
            <p class="text-slate-700 whitespace-pre-wrap">{{ review.blockers || '-' }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">다음 주 계획</h3>
            <p class="text-slate-700 whitespace-pre-wrap">{{ review.next_plan || '-' }}</p>
          </div>
        </div>

        <div v-else-if="!editing" class="text-slate-400 text-sm">아직 리뷰가 작성되지 않았습니다.</div>

        <form v-if="editing" @submit.prevent="saveReview" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">미완료 사유</label>
            <textarea v-model="form.incomplete_reason" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="완료하지 못한 업무의 사유를 작성하세요"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">이슈 / 블로커</label>
            <textarea v-model="form.blockers" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="진행을 막는 문제가 있다면 작성하세요"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">다음 주 계획</label>
            <textarea v-model="form.next_plan" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="다음 스프린트에 할 일을 작성하세요"></textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" @click="editing = false" class="px-4 py-2 text-sm text-slate-600">취소</button>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">저장</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
