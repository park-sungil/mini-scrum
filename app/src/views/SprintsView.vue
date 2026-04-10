<script setup>
import { ref } from 'vue'
import { store, api } from '../store'

const showModal = ref(false)
const editingSprint = ref(null)
const form = ref({ title: '', goal: '', start_date: '', end_date: '' })

function openCreateModal() {
  editingSprint.value = null
  const today = new Date()
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 6)
  form.value = { title: `Sprint ${store.sprints.length + 1}`, goal: '', start_date: today.toISOString().slice(0, 10), end_date: nextWeek.toISOString().slice(0, 10) }
  showModal.value = true
}
function openEditModal(s) {
  editingSprint.value = s
  form.value = { title: s.title, goal: s.goal || '', start_date: s.start_date, end_date: s.end_date }
  showModal.value = true
}
async function saveSprint() {
  try {
    if (editingSprint.value) await api.updateSprint(editingSprint.value.id, form.value)
    else await api.createSprint(form.value)
    showModal.value = false
  } catch (e) { alert(e.message || '스프린트 저장에 실패했습니다.') }
}
async function deleteSprint(id) {
  if (!confirm('이 스프린트와 관련된 업무, 리뷰, 회고가 모두 삭제됩니다. 계속하시겠습니까?')) return
  await api.deleteSprint(id)
}
function isCurrentSprint(s) { const now = new Date().toISOString().slice(0, 10); return s.start_date <= now && s.end_date >= now }
function getDaysLeft(d) { return Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000)) }
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-4xl" style="color: var(--text)">Sprints</h1>
        <p class="text-sm mt-1" style="color: var(--text-muted)">스프린트 관리</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">+ 새 스프린트</button>
    </div>

    <div v-if="store.sprints.length === 0" class="card p-12 text-center">
      <div class="font-display text-2xl mb-2" style="color: var(--text-muted)">No Sprints Yet</div>
      <p class="text-sm" style="color: var(--text-muted)">새 스프린트를 생성하여 시작하세요.</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="(sprint, i) in store.sprints" :key="sprint.id" class="card p-5 animate-in"
        :style="{ animationDelay: (i * 0.05) + 's', borderLeft: isCurrentSprint(sprint) ? '3px solid var(--accent)' : '' }">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h3 class="font-semibold" style="color: var(--text)">{{ sprint.title }}</h3>
              <span v-if="isCurrentSprint(sprint)" class="badge" style="background: var(--accent-light); color: var(--accent)">진행 중 &middot; {{ getDaysLeft(sprint.end_date) }}일 남음</span>
            </div>
            <p v-if="sprint.goal" class="text-sm mt-1 mb-2" style="color: var(--text-secondary)">{{ sprint.goal }}</p>
            <p class="font-mono text-xs" style="color: var(--text-muted)">{{ sprint.start_date }} ~ {{ sprint.end_date }}</p>
          </div>
          <div class="flex gap-3 ml-4">
            <button @click="openEditModal(sprint)" class="text-xs font-medium" style="color: var(--text-muted)" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'">수정</button>
            <button @click="deleteSprint(sprint.id)" class="text-xs font-medium" style="color: var(--text-muted)" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'">삭제</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content">
        <h2 class="font-display text-2xl mb-5" style="color: var(--text)">{{ editingSprint ? '스프린트 수정' : '새 스프린트' }}</h2>
        <form @submit.prevent="saveSprint" class="space-y-4">
          <div><label class="label">제목 *</label><input v-model="form.title" required class="input" /></div>
          <div><label class="label">목표</label><textarea v-model="form.goal" rows="3" class="input" placeholder="이번 스프린트의 목표를 작성하세요"></textarea></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="label">시작일 *</label><input v-model="form.start_date" type="date" required class="input" /></div>
            <div><label class="label">종료일 *</label><input v-model="form.end_date" type="date" required class="input" /></div>
          </div>
          <div class="flex justify-end gap-3 pt-3">
            <button type="button" @click="showModal = false" class="btn-ghost">취소</button>
            <button type="submit" class="btn-primary">{{ editingSprint ? '수정' : '생성' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
