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
  { key: 'todo', label: '할 일', color: 'blue' },
  { key: 'in_progress', label: '진행 중', color: 'amber' },
  { key: 'done', label: '완료', color: 'green' },
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
  const data = { ...form.value, sprint_id: selectedSprintId.value }
  if (!data.assignee_id) data.assignee_id = null
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
const priorityColors = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-slate-600 bg-slate-50' }

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
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">업무 보드</h1>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedSprintId"
          @change="loadTasks"
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
        <button
          @click="openCreateModal"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + 업무 추가
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">로딩 중...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="col in columns"
        :key="col.key"
        class="bg-slate-100 rounded-xl p-4 min-h-[400px]"
        @dragover.prevent
        @drop="onDrop($event, col.key)"
      >
        <h2 class="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span
            :class="{
              'bg-blue-500': col.color === 'blue',
              'bg-amber-500': col.color === 'amber',
              'bg-green-500': col.color === 'green',
            }"
            class="w-2.5 h-2.5 rounded-full"
          ></span>
          {{ col.label }}
          <span class="text-slate-400 font-normal">({{ tasksByStatus[col.key].length }})</span>
        </h2>

        <div class="space-y-3">
          <div
            v-for="task in tasksByStatus[col.key]"
            :key="task.id"
            draggable="true"
            @dragstart="onDragStart($event, task)"
            class="bg-white rounded-lg p-4 shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-medium text-slate-800 text-sm">{{ task.title }}</h3>
              <div class="flex gap-1">
                <button @click="openEditModal(task)" class="text-slate-400 hover:text-slate-600 text-xs">수정</button>
                <button @click="deleteTask(task.id)" class="text-slate-400 hover:text-red-500 text-xs">삭제</button>
              </div>
            </div>
            <p v-if="task.description" class="text-xs text-slate-500 mb-2">{{ task.description }}</p>
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="priorityColors[task.priority]" class="text-xs px-2 py-0.5 rounded-full">
                {{ priorityLabels[task.priority] }}
              </span>
              <span v-if="task.assignee_id" class="text-xs text-slate-500">
                {{ getMemberName(task.assignee_id) }}
              </span>
              <span v-if="task.due_date" class="text-xs text-slate-400">{{ task.due_date }}</span>
            </div>
            <!-- Status change buttons -->
            <div class="flex gap-1 mt-2">
              <button
                v-if="col.key !== 'todo'"
                @click="changeStatus(task.id, col.key === 'done' ? 'in_progress' : 'todo')"
                class="text-xs text-slate-400 hover:text-slate-600 bg-slate-50 px-2 py-1 rounded"
              >
                ← {{ col.key === 'done' ? '진행 중' : '할 일' }}
              </button>
              <button
                v-if="col.key !== 'done'"
                @click="changeStatus(task.id, col.key === 'todo' ? 'in_progress' : 'done')"
                class="text-xs text-slate-400 hover:text-slate-600 bg-slate-50 px-2 py-1 rounded"
              >
                {{ col.key === 'todo' ? '진행 중' : '완료' }} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">
          {{ editingTask ? '업무 수정' : '새 업무 추가' }}
        </h2>
        <form @submit.prevent="saveTask" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">제목 *</label>
            <input v-model="form.title" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">설명</label>
            <textarea v-model="form.description" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">담당자</label>
              <select v-model="form.assignee_id" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">미지정</option>
                <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">우선순위</label>
              <select v-model="form.priority" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">마감일</label>
              <input v-model="form.due_date" type="date" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div v-if="editingTask">
              <label class="block text-sm font-medium text-slate-700 mb-1">상태</label>
              <select v-model="form.status" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="todo">할 일</option>
                <option value="in_progress">진행 중</option>
                <option value="done">완료</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">취소</button>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              {{ editingTask ? '수정' : '추가' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
