<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const sprints = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingSprint = ref(null)

const form = ref({
  title: '',
  goal: '',
  start_date: '',
  end_date: '',
})

onMounted(async () => {
  try {
    sprints.value = await api.getSprints()
  } catch (e) {
    console.error('Failed to load sprints:', e)
  } finally {
    loading.value = false
  }
})

function openCreateModal() {
  editingSprint.value = null
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 6)
  form.value = {
    title: `Sprint ${sprints.value.length + 1}`,
    goal: '',
    start_date: today.toISOString().slice(0, 10),
    end_date: nextWeek.toISOString().slice(0, 10),
  }
  showModal.value = true
}

function openEditModal(sprint) {
  editingSprint.value = sprint
  form.value = {
    title: sprint.title,
    goal: sprint.goal || '',
    start_date: sprint.start_date,
    end_date: sprint.end_date,
  }
  showModal.value = true
}

async function saveSprint() {
  if (editingSprint.value) {
    await api.updateSprint(editingSprint.value.id, form.value)
  } else {
    await api.createSprint(form.value)
  }
  showModal.value = false
  sprints.value = await api.getSprints()
}

function isCurrentSprint(sprint) {
  const now = new Date().toISOString().slice(0, 10)
  return sprint.start_date <= now && sprint.end_date >= now
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">스프린트 관리</h1>
      <button
        @click="openCreateModal"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        + 새 스프린트
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">로딩 중...</div>

    <div v-else-if="sprints.length === 0" class="text-center py-12 text-slate-400">
      등록된 스프린트가 없습니다. 새 스프린트를 생성하세요.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="sprint in sprints"
        :key="sprint.id"
        class="bg-white rounded-xl shadow-sm border p-5"
        :class="isCurrentSprint(sprint) ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold text-slate-800">{{ sprint.title }}</h3>
              <span
                v-if="isCurrentSprint(sprint)"
                class="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium"
              >
                현재 진행 중
              </span>
            </div>
            <p v-if="sprint.goal" class="text-sm text-slate-600 mb-2">{{ sprint.goal }}</p>
            <p class="text-sm text-slate-400">{{ sprint.start_date }} ~ {{ sprint.end_date }}</p>
          </div>
          <button @click="openEditModal(sprint)" class="text-sm text-indigo-600 hover:text-indigo-800">수정</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">
          {{ editingSprint ? '스프린트 수정' : '새 스프린트 생성' }}
        </h2>
        <form @submit.prevent="saveSprint" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">제목 *</label>
            <input v-model="form.title" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">목표</label>
            <textarea v-model="form.goal" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="이번 스프린트의 목표를 작성하세요"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">시작일 *</label>
              <input v-model="form.start_date" type="date" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">종료일 *</label>
              <input v-model="form.end_date" type="date" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-sm text-slate-600">취소</button>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              {{ editingSprint ? '수정' : '생성' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
