<script setup>
import { ref, computed, watch } from 'vue'
import { store, api } from '../store'

const selectedSprintId = ref(store.sprints[0]?.id || null)
watch(() => store.sprints, (sprints) => {
  if (!selectedSprintId.value && sprints.length) selectedSprintId.value = sprints[0].id
})
const showModal = ref(false)
const editingRetro = ref(null)
const form = ref({ member_id: '', keep_items: '', problem_items: '', try_items: '' })

const sprintRetros = computed(() => store.retros.filter(r => r.sprint_id === selectedSprintId.value))

function getMemberName(id) { return store.members.find(m => m.id === id)?.name || '익명' }

const kptConfig = [
  { key: 'keep_items', label: 'Keep', sub: '잘한 점', color: 'var(--success)', light: 'var(--success-light)' },
  { key: 'problem_items', label: 'Problem', sub: '개선할 점', color: 'var(--danger)', light: 'var(--danger-light)' },
  { key: 'try_items', label: 'Try', sub: '시도할 것', color: 'var(--info)', light: 'var(--info-light)' },
]

function openCreateModal() { editingRetro.value = null; form.value = { member_id: '', keep_items: '', problem_items: '', try_items: '' }; showModal.value = true }
function openEditModal(r) {
  editingRetro.value = r
  form.value = { member_id: r.member_id || '', keep_items: r.keep_items || '', problem_items: r.problem_items || '', try_items: r.try_items || '' }
  showModal.value = true
}
async function saveRetro() {
  const data = { sprint_id: selectedSprintId.value, ...form.value }
  if (!data.member_id) data.member_id = null
  if (editingRetro.value) await api.updateRetro(editingRetro.value.id, data)
  else await api.createRetro(data)
  showModal.value = false
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-4xl" style="color: var(--text)">Retrospective</h1>
        <p class="text-sm mt-1" style="color: var(--text-muted)">회고 (KPT)</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedSprintId" class="input" style="width: auto">
          <option v-for="s in store.sprints" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
        <button @click="openCreateModal" class="btn-primary">+ 회고 작성</button>
      </div>
    </div>

    <div class="animate-in">
      <div class="grid grid-cols-3 gap-5 mb-8">
        <div v-for="col in kptConfig" :key="col.key" class="rounded-xl p-5" :style="{ background: col.light }">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-2 h-2 rounded-full" :style="{ background: col.color }"></div>
            <h2 class="text-xs font-bold uppercase tracking-wider" :style="{ color: col.color }">{{ col.label }}</h2>
            <span class="text-[10px]" style="color: var(--text-muted)">{{ col.sub }}</span>
          </div>
          <ul class="space-y-3">
            <template v-for="retro in sprintRetros" :key="col.key + '-' + retro.id">
              <li v-if="retro[col.key]" class="text-sm">
                <div class="text-[11px] font-semibold mb-0.5" :style="{ color: col.color }">{{ getMemberName(retro.member_id) }}</div>
                <div class="whitespace-pre-wrap leading-relaxed" style="color: var(--text-secondary)">{{ retro[col.key] }}</div>
              </li>
            </template>
          </ul>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-secondary)">개별 회고</h2>
      </div>
      <div v-if="!sprintRetros.length" class="card p-8 text-center">
        <div class="text-sm" style="color: var(--text-muted)">아직 작성된 회고가 없습니다.</div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div v-for="(retro, i) in sprintRetros" :key="retro.id" class="card p-5 animate-in" :style="{ animationDelay: (i * 0.05) + 's' }">
          <div class="flex items-center justify-between mb-3">
            <span class="font-semibold text-sm" style="color: var(--text)">{{ getMemberName(retro.member_id) }}</span>
            <button @click="openEditModal(retro)" class="text-[11px] font-medium" style="color: var(--text-muted)" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'">수정</button>
          </div>
          <div class="space-y-2 text-[13px]">
            <div v-if="retro.keep_items" class="flex gap-2"><span class="font-semibold flex-shrink-0" style="color: var(--success)">K</span><span style="color: var(--text-secondary)" class="whitespace-pre-wrap">{{ retro.keep_items }}</span></div>
            <div v-if="retro.problem_items" class="flex gap-2"><span class="font-semibold flex-shrink-0" style="color: var(--danger)">P</span><span style="color: var(--text-secondary)" class="whitespace-pre-wrap">{{ retro.problem_items }}</span></div>
            <div v-if="retro.try_items" class="flex gap-2"><span class="font-semibold flex-shrink-0" style="color: var(--info)">T</span><span style="color: var(--text-secondary)" class="whitespace-pre-wrap">{{ retro.try_items }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content" style="max-width: 520px">
        <h2 class="font-display text-2xl mb-5" style="color: var(--text)">{{ editingRetro ? '회고 수정' : '새 회고' }}</h2>
        <form @submit.prevent="saveRetro" class="space-y-4">
          <div><label class="label">작성자</label><select v-model="form.member_id" class="input"><option value="">익명</option><option v-for="m in store.members" :key="m.id" :value="m.id">{{ m.name }}</option></select></div>
          <div><label class="label" style="color: var(--success)">Keep &mdash; 잘한 점</label><textarea v-model="form.keep_items" rows="3" class="input" placeholder="이번 스프린트에서 잘한 점을 작성하세요"></textarea></div>
          <div><label class="label" style="color: var(--danger)">Problem &mdash; 개선할 점</label><textarea v-model="form.problem_items" rows="3" class="input" placeholder="개선이 필요한 점을 작성하세요"></textarea></div>
          <div><label class="label" style="color: var(--info)">Try &mdash; 시도할 것</label><textarea v-model="form.try_items" rows="3" class="input" placeholder="다음에 시도해볼 것을 작성하세요"></textarea></div>
          <div class="flex justify-end gap-3 pt-3">
            <button type="button" @click="showModal = false" class="btn-ghost">취소</button>
            <button type="submit" class="btn-primary">{{ editingRetro ? '수정' : '작성' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
