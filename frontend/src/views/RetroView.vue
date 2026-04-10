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

const kptConfig = [
  { key: 'keep_items', label: 'Keep', sub: '잘한 점', color: 'var(--success)', light: 'var(--success-light)' },
  { key: 'problem_items', label: 'Problem', sub: '개선할 점', color: 'var(--danger)', light: 'var(--danger-light)' },
  { key: 'try_items', label: 'Try', sub: '시도할 것', color: 'var(--info)', light: 'var(--info-light)' },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-4xl" style="color: var(--text); font-style: italic">Retrospective</h1>
        <p class="text-sm mt-1" style="color: var(--text-muted)">회고 (KPT)</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedSprintId" @change="loadRetros" class="input" style="width: auto">
          <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
        <button @click="openCreateModal" class="btn-primary">+ 회고 작성</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--text-muted)">
      <div class="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="animate-in">
      <!-- KPT Board -->
      <div class="grid grid-cols-3 gap-5 mb-8">
        <div
          v-for="col in kptConfig"
          :key="col.key"
          class="rounded-xl p-5"
          :style="{ background: col.light, border: '1px solid ' + col.light }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-2 h-2 rounded-full" :style="{ background: col.color }"></div>
            <h2 class="text-xs font-bold uppercase tracking-wider" :style="{ color: col.color }">
              {{ col.label }}
            </h2>
            <span class="text-[10px]" style="color: var(--text-muted)">{{ col.sub }}</span>
          </div>
          <ul class="space-y-3">
            <template v-for="retro in retros" :key="col.key + '-' + retro.id">
              <li v-if="retro[col.key]" class="text-sm" :style="{ color: 'var(--text)' }">
                <div class="text-[11px] font-semibold mb-0.5" :style="{ color: col.color }">{{ getMemberName(retro.member_id) }}</div>
                <div class="whitespace-pre-wrap leading-relaxed" style="color: var(--text-secondary)">{{ retro[col.key] }}</div>
              </li>
            </template>
          </ul>
        </div>
      </div>

      <!-- Individual Cards -->
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-secondary)">개별 회고</h2>
      </div>
      <div v-if="retros.length === 0" class="card p-8 text-center">
        <div class="text-sm" style="color: var(--text-muted)">아직 작성된 회고가 없습니다.</div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div
          v-for="(retro, i) in retros"
          :key="retro.id"
          class="card p-5 animate-in"
          :style="{ animationDelay: (i * 0.05) + 's' }"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="font-semibold text-sm" style="color: var(--text)">{{ getMemberName(retro.member_id) }}</span>
            <button @click="openEditModal(retro)" class="text-[11px] font-medium" style="color: var(--text-muted)" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'">수정</button>
          </div>
          <div class="space-y-2 text-[13px]">
            <div v-if="retro.keep_items" class="flex gap-2">
              <span class="font-semibold flex-shrink-0" style="color: var(--success)">K</span>
              <span style="color: var(--text-secondary)" class="whitespace-pre-wrap">{{ retro.keep_items }}</span>
            </div>
            <div v-if="retro.problem_items" class="flex gap-2">
              <span class="font-semibold flex-shrink-0" style="color: var(--danger)">P</span>
              <span style="color: var(--text-secondary)" class="whitespace-pre-wrap">{{ retro.problem_items }}</span>
            </div>
            <div v-if="retro.try_items" class="flex gap-2">
              <span class="font-semibold flex-shrink-0" style="color: var(--info)">T</span>
              <span style="color: var(--text-secondary)" class="whitespace-pre-wrap">{{ retro.try_items }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content" style="max-width: 520px">
        <h2 class="font-display text-2xl mb-5" style="font-style: italic; color: var(--text)">
          {{ editingRetro ? '회고 수정' : '새 회고' }}
        </h2>
        <form @submit.prevent="saveRetro" class="space-y-4">
          <div>
            <label class="label">작성자</label>
            <select v-model="form.member_id" class="input">
              <option value="">익명</option>
              <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
          <div>
            <label class="label" style="color: var(--success)">Keep &mdash; 잘한 점</label>
            <textarea v-model="form.keep_items" rows="3" class="input" placeholder="이번 스프린트에서 잘한 점을 작성하세요"></textarea>
          </div>
          <div>
            <label class="label" style="color: var(--danger)">Problem &mdash; 개선할 점</label>
            <textarea v-model="form.problem_items" rows="3" class="input" placeholder="개선이 필요한 점을 작성하세요"></textarea>
          </div>
          <div>
            <label class="label" style="color: var(--info)">Try &mdash; 시도할 것</label>
            <textarea v-model="form.try_items" rows="3" class="input" placeholder="다음에 시도해볼 것을 작성하세요"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-3">
            <button type="button" @click="showModal = false" class="btn-ghost">취소</button>
            <button type="submit" class="btn-primary">{{ editingRetro ? '수정' : '작성' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
