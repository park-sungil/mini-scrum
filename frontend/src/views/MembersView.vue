<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const members = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingMember = ref(null)
const form = ref({ name: '', role: '' })

onMounted(async () => {
  try {
    members.value = await api.getMembers()
  } catch (e) {
    console.error('Failed to load members:', e)
  } finally {
    loading.value = false
  }
})

function openCreateModal() {
  editingMember.value = null
  form.value = { name: '', role: '' }
  showModal.value = true
}

function openEditModal(member) {
  editingMember.value = member
  form.value = { name: member.name, role: member.role || '' }
  showModal.value = true
}

async function saveMember() {
  if (editingMember.value) {
    await api.updateMember(editingMember.value.id, form.value)
  } else {
    await api.createMember(form.value)
  }
  showModal.value = false
  members.value = await api.getMembers()
}

async function deleteMember(id) {
  if (!confirm('이 팀원을 삭제하시겠습니까?')) return
  await api.deleteMember(id)
  members.value = await api.getMembers()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">팀원 관리</h1>
      <button
        @click="openCreateModal"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        + 팀원 추가
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">로딩 중...</div>

    <div v-else-if="members.length === 0" class="text-center py-12 text-slate-400">
      등록된 팀원이 없습니다. 팀원을 추가하세요.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="member in members"
        :key="member.id"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {{ member.name.charAt(0) }}
              </div>
              <div>
                <h3 class="font-semibold text-slate-800">{{ member.name }}</h3>
                <p class="text-sm text-slate-500">{{ member.role || '역할 미지정' }}</p>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="openEditModal(member)" class="text-sm text-indigo-600 hover:text-indigo-800">수정</button>
            <button @click="deleteMember(member.id)" class="text-sm text-red-500 hover:text-red-700">삭제</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">
          {{ editingMember ? '팀원 수정' : '새 팀원 추가' }}
        </h2>
        <form @submit.prevent="saveMember" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">이름 *</label>
            <input v-model="form.name" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">역할</label>
            <input v-model="form.role" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="예: 프론트엔드 개발자" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-sm text-slate-600">취소</button>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              {{ editingMember ? '수정' : '추가' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
