<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const sprints = ref([])
const members = ref([])
const retros = ref([])
const selectedSprintId = ref(null)
const loading = ref(true)
const showModal = ref(false)
const editingRetro = ref(null)

const form = ref({
  member_id: '',
  keep_items: '',
  problem_items: '',
  try_items: '',
})

onMounted(async () => {
  try {
    const [sprintsData, membersData] = await Promise.all([
      api.getSprints(),
      api.getMembers(),
    ])
    sprints.value = sprintsData
    members.value = membersData
    if (sprintsData.length > 0) {
      selectedSprintId.value = sprintsData[0].id
      await loadRetros()
    }
  } catch (e) {
    console.error('Failed to load:', e)
  } finally {
    loading.value = false
  }
})

async function loadRetros() {
  if (!selectedSprintId.value) return
  retros.value = await api.getRetros(selectedSprintId.value)
}

function openCreateModal() {
  editingRetro.value = null
  form.value = { member_id: '', keep_items: '', problem_items: '', try_items: '' }
  showModal.value = true
}

function openEditModal(retro) {
  editingRetro.value = retro
  form.value = {
    member_id: retro.member_id || '',
    keep_items: retro.keep_items || '',
    problem_items: retro.problem_items || '',
    try_items: retro.try_items || '',
  }
  showModal.value = true
}

async function saveRetro() {
  const data = {
    sprint_id: selectedSprintId.value,
    ...form.value,
  }
  if (!data.member_id) data.member_id = null

  if (editingRetro.value) {
    await api.updateRetro(editingRetro.value.id, data)
  } else {
    await api.createRetro(data)
  }
  showModal.value = false
  await loadRetros()
}

function getMemberName(id) {
  return members.value.find(m => m.id === id)?.name || '익명'
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">회고 (KPT)</h1>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedSprintId"
          @change="loadRetros"
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
        <button
          @click="openCreateModal"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + 회고 작성
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">로딩 중...</div>

    <div v-else>
      <!-- KPT Summary Board -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-green-50 rounded-xl p-5 border border-green-200">
          <h2 class="text-sm font-semibold text-green-800 uppercase tracking-wide mb-3">Keep - 잘한 점</h2>
          <ul class="space-y-2">
            <li v-for="retro in retros" :key="'k-' + retro.id" v-if="retro.keep_items" class="text-sm text-green-700">
              <span class="font-medium">{{ getMemberName(retro.member_id) }}:</span>
              <span class="whitespace-pre-wrap"> {{ retro.keep_items }}</span>
            </li>
          </ul>
        </div>
        <div class="bg-red-50 rounded-xl p-5 border border-red-200">
          <h2 class="text-sm font-semibold text-red-800 uppercase tracking-wide mb-3">Problem - 개선할 점</h2>
          <ul class="space-y-2">
            <li v-for="retro in retros" :key="'p-' + retro.id" v-if="retro.problem_items" class="text-sm text-red-700">
              <span class="font-medium">{{ getMemberName(retro.member_id) }}:</span>
              <span class="whitespace-pre-wrap"> {{ retro.problem_items }}</span>
            </li>
          </ul>
        </div>
        <div class="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <h2 class="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-3">Try - 시도할 것</h2>
          <ul class="space-y-2">
            <li v-for="retro in retros" :key="'t-' + retro.id" v-if="retro.try_items" class="text-sm text-blue-700">
              <span class="font-medium">{{ getMemberName(retro.member_id) }}:</span>
              <span class="whitespace-pre-wrap"> {{ retro.try_items }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Individual Retro Cards -->
      <h2 class="text-lg font-semibold text-slate-800 mb-4">개별 회고</h2>
      <div v-if="retros.length === 0" class="text-center py-8 text-slate-400">아직 작성된 회고가 없습니다.</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="retro in retros"
          :key="retro.id"
          class="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="font-medium text-slate-800">{{ getMemberName(retro.member_id) }}</span>
            <button @click="openEditModal(retro)" class="text-sm text-indigo-600 hover:text-indigo-800">수정</button>
          </div>
          <div class="space-y-2 text-sm">
            <div v-if="retro.keep_items">
              <span class="font-medium text-green-600">Keep:</span>
              <span class="text-slate-600 whitespace-pre-wrap"> {{ retro.keep_items }}</span>
            </div>
            <div v-if="retro.problem_items">
              <span class="font-medium text-red-600">Problem:</span>
              <span class="text-slate-600 whitespace-pre-wrap"> {{ retro.problem_items }}</span>
            </div>
            <div v-if="retro.try_items">
              <span class="font-medium text-blue-600">Try:</span>
              <span class="text-slate-600 whitespace-pre-wrap"> {{ retro.try_items }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">
          {{ editingRetro ? '회고 수정' : '새 회고 작성' }}
        </h2>
        <form @submit.prevent="saveRetro" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">작성자</label>
            <select v-model="form.member_id" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">익명</option>
              <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-green-700 mb-1">Keep - 잘한 점, 계속할 것</label>
            <textarea v-model="form.keep_items" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="이번 스프린트에서 잘한 점을 작성하세요"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-red-700 mb-1">Problem - 문제점, 개선이 필요한 것</label>
            <textarea v-model="form.problem_items" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="개선이 필요한 점을 작성하세요"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-blue-700 mb-1">Try - 다음에 시도해볼 것</label>
            <textarea v-model="form.try_items" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="다음에 시도해볼 것을 작성하세요"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-sm text-slate-600">취소</button>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              {{ editingRetro ? '수정' : '작성' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
