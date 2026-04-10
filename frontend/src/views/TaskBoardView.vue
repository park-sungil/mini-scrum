<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '../api'

const tasks = ref([])
const members = ref([])
const sprints = ref([])
const selectedSprintId = ref(null)
const loading = ref(true)
const showModal = ref(false)
const editingTask = ref(null)

const form = ref({
  title: '',
  description: '',
  assignee_id: '',
  priority: 'medium',
  due_date: '',
  status: 'todo',
})

const columns = [
  { key: 'todo', label: '할 일', color: 'var(--info)', lightColor: 'var(--info-light)' },
  { key: 'in_progress', label: '진행 중', color: 'var(--warning)', lightColor: 'var(--warning-light)' },
  { key: 'done', label: '완료', color: 'var(--success)', lightColor: 'var(--success-light)' },
]

const tasksByStatus = computed(() => {
  const grouped = { todo: [], in_progress: [], done: [] }
  tasks.value.forEach(t => {
    if (grouped[t.status]) grouped[t.status].push(t)
  })
  return grouped
})

onMounted(async () => {
  try {
    const [membersData, sprintsData] = await Promise.all([
      api.getMembers(),
      api.getSprints(),
    ])
    members.value = membersData
    sprints.value = sprintsData
    if (sprintsData.length > 0) {
      selectedSprintId.value = sprintsData[0].id
      await loadTasks()
    }
  } catch (e) {
    console.error('Failed to load data:', e)
  } finally {
    loading.value = false
  }
})

async function loadTasks() {
  if (!selectedSprintId.value) return
  tasks.value = await api.getTasks(selectedSprintId.value)
}

function openCreateModal() {
  if (!selectedSprintId.value) {
    alert('스프린트를 먼저 생성해주세요. (스프린트 메뉴에서 추가)')
    return
  }
  editingTask.value = null
  form.value = { title: '', description: '', assignee_id: '', priority: 'medium', due_date: '', status: 'todo' }
  showModal.value = true
}

function openEditModal(task) {
  editingTask.value = task
  form.value = {
    title: task.title,
    description: task.description || '',
    assignee_id: task.assignee_id || '',
    priority: task.priority,
    due_date: task.due_date || '',
    status: task.status,
  }
  showModal.value = true
}

async function saveTask() {
  if (!form.value.assignee_id) {
    alert('담당자를 선택해주세요.')
    return
  }
  const data = { ...form.value, sprint_id: selectedSprintId.value }
  if (!data.due_date) data.due_date = null

  if (editingTask.value) {
    await api.updateTask(editingTask.value.id, data)
  } else {
    await api.createTask(data)
  }
  showModal.value = false
  await loadTasks()
}

async function deleteTask(id) {
  if (!confirm('이 업무를 삭제하시겠습니까?')) return
  await api.deleteTask(id)
  await loadTasks()
}

async function changeStatus(taskId, newStatus) {
  await api.updateTask(taskId, { status: newStatus })
  await loadTasks()
}

function getMemberName(id) {
  return members.value.find(m => m.id === id)?.name || '-'
}

const priorityLabels = { high: '높음', medium: '보통', low: '낮음' }
const priorityStyles = {
  high: { background: 'var(--danger-light)', color: 'var(--danger)' },
  medium: { background: 'var(--warning-light)', color: 'var(--warning)' },
  low: { background: 'var(--bg)', color: 'var(--text-muted)' },
}

function onDragStart(event, task) {
  event.dataTransfer.setData('taskId', task.id)
}

async function onDrop(event, status) {
  const taskId = event.dataTransfer.getData('taskId')
  if (taskId) {
    await changeStatus(Number(taskId), status)
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-4xl" style="color: var(--text); font-style: italic">Task Board</h1>
        <p class="text-sm mt-1" style="color: var(--text-muted)">업무 보드</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedSprintId" @change="loadTasks" class="input" style="width: auto">
          <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
        <button @click="openCreateModal" class="btn-primary">+ 업무 추가</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--text-muted)">
      <div class="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="grid grid-cols-3 gap-5">
      <div
        v-for="col in columns"
        :key="col.key"
        class="rounded-xl p-4 min-h-[450px]"
        :style="{ background: col.lightColor }"
        @dragover.prevent
        @drop="onDrop($event, col.key)"
      >
        <div class="flex items-center gap-2 mb-4 px-1">
          <div class="w-2 h-2 rounded-full" :style="{ background: col.color }"></div>
          <h2 class="text-xs font-bold uppercase tracking-wider" :style="{ color: col.color }">
            {{ col.label }}
          </h2>
          <span class="font-mono text-xs" style="color: var(--text-muted)">{{ tasksByStatus[col.key].length }}</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="task in tasksByStatus[col.key]"
            :key="task.id"
            draggable="true"
            @dragstart="onDragStart($event, task)"
            class="card p-4 cursor-grab active:cursor-grabbing"
            style="border-radius: 10px"
          >
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-semibold text-[13px] leading-tight" style="color: var(--text)">{{ task.title }}</h3>
              <div class="flex gap-1.5 ml-2 flex-shrink-0">
                <button @click="openEditModal(task)" class="text-[11px]" style="color: var(--text-muted)" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'">수정</button>
                <button @click="deleteTask(task.id)" class="text-[11px]" style="color: var(--text-muted)" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'">삭제</button>
              </div>
            </div>
            <p v-if="task.description" class="text-xs mb-2.5 leading-relaxed" style="color: var(--text-muted)">{{ task.description }}</p>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="badge" :style="priorityStyles[task.priority]">{{ priorityLabels[task.priority] }}</span>
              <span v-if="task.assignee_id" class="text-[11px] font-medium" style="color: var(--text-secondary)">{{ getMemberName(task.assignee_id) }}</span>
              <span v-if="task.due_date" class="font-mono text-[11px]" style="color: var(--text-muted)">{{ task.due_date }}</span>
            </div>
            <div class="flex gap-1.5 mt-2.5">
              <button
                v-if="col.key !== 'todo'"
                @click="changeStatus(task.id, col.key === 'done' ? 'in_progress' : 'todo')"
                class="text-[11px] font-medium px-2 py-1 rounded-md transition-colors"
                style="color: var(--text-muted); background: var(--bg)"
                onmouseover="this.style.color='var(--text-secondary)'"
                onmouseout="this.style.color='var(--text-muted)'"
              >
                &larr; {{ col.key === 'done' ? '진행 중' : '할 일' }}
              </button>
              <button
                v-if="col.key !== 'done'"
                @click="changeStatus(task.id, col.key === 'todo' ? 'in_progress' : 'done')"
                class="text-[11px] font-medium px-2 py-1 rounded-md transition-colors"
                style="color: var(--text-muted); background: var(--bg)"
                onmouseover="this.style.color='var(--text-secondary)'"
                onmouseout="this.style.color='var(--text-muted)'"
              >
                {{ col.key === 'todo' ? '진행 중' : '완료' }} &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content" style="max-width: 520px">
        <h2 class="font-display text-2xl mb-5" style="font-style: italic; color: var(--text)">
          {{ editingTask ? '업무 수정' : '새 업무' }}
        </h2>
        <form @submit.prevent="saveTask" class="space-y-4">
          <div>
            <label class="label">제목 *</label>
            <input v-model="form.title" required class="input" />
          </div>
          <div>
            <label class="label">설명</label>
            <textarea v-model="form.description" rows="3" class="input"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">담당자 *</label>
              <select v-model="form.assignee_id" required class="input">
                <option value="" disabled>선택하세요</option>
                <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>
            <div>
              <label class="label">우선순위</label>
              <select v-model="form.priority" class="input">
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">마감일</label>
              <input v-model="form.due_date" type="date" class="input" />
            </div>
            <div v-if="editingTask">
              <label class="label">상태</label>
              <select v-model="form.status" class="input">
                <option value="todo">할 일</option>
                <option value="in_progress">진행 중</option>
                <option value="done">완료</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-3">
            <button type="button" @click="showModal = false" class="btn-ghost">취소</button>
            <button type="submit" class="btn-primary">{{ editingTask ? '수정' : '추가' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
