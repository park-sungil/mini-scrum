<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const members = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingMember = ref(null)
const form = ref({ name: '', role: '' })

const avatarColors = ['#D4654A', '#5B8A72', '#C99A3C', '#5B7FB5', '#8B6BAE']

function getColor(index) {
  return avatarColors[index % avatarColors.length]
}

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
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-4xl" style="color: var(--text); font-style: italic">Members</h1>
        <p class="text-sm mt-1" style="color: var(--text-muted)">팀원 관리</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">+ 팀원 추가</button>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--text-muted)">
      <div class="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="members.length === 0" class="card p-12 text-center">
      <div class="font-display text-2xl mb-2" style="color: var(--text-muted); font-style: italic">No Members Yet</div>
      <p class="text-sm" style="color: var(--text-muted)">팀원을 추가하여 시작하세요.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="(member, i) in members"
        :key="member.id"
        class="card p-5 animate-in"
        :style="{ animationDelay: (i * 0.05) + 's' }"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
              :style="{ background: getColor(i) }"
            >
              {{ member.name.charAt(0) }}
            </div>
            <div>
              <h3 class="font-semibold text-sm" style="color: var(--text)">{{ member.name }}</h3>
              <p class="text-xs mt-0.5" style="color: var(--text-muted)">{{ member.role || '역할 미지정' }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="openEditModal(member)" class="text-xs font-medium" style="color: var(--text-muted)" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'">수정</button>
            <button @click="deleteMember(member.id)" class="text-xs font-medium" style="color: var(--text-muted)" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'">삭제</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content">
        <h2 class="font-display text-2xl mb-5" style="font-style: italic; color: var(--text)">
          {{ editingMember ? '팀원 수정' : '새 팀원 추가' }}
        </h2>
        <form @submit.prevent="saveMember" class="space-y-4">
          <div>
            <label class="label">이름 *</label>
            <input v-model="form.name" required class="input" />
          </div>
          <div>
            <label class="label">역할</label>
            <input v-model="form.role" class="input" placeholder="예: 프론트엔드 개발자" />
          </div>
          <div class="flex justify-end gap-3 pt-3">
            <button type="button" @click="showModal = false" class="btn-ghost">취소</button>
            <button type="submit" class="btn-primary">{{ editingMember ? '수정' : '추가' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
