import { reactive } from 'vue'

const BASE_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || res.statusText)
  }
  return res.json()
}

export const store = reactive({
  members: [],
  sprints: [],
  tasks: [],
  reviews: [],
  retros: [],
  rules: [],
  loaded: false,
  loading: false,
})

// Load all data from server
export async function loadAll() {
  store.loading = true
  try {
    const data = await request('/data')
    store.members = data.members
    store.sprints = data.sprints
    store.tasks = data.tasks
    store.reviews = data.reviews
    store.retros = data.retros
    store.rules = data.rules
    store.loaded = true
  } finally {
    store.loading = false
  }
}

// After any mutation, reload all data
async function mutate(path, options) {
  const result = await request(path, options)
  await loadAll()
  return result
}

export const api = {
  // Members
  createMember: (data) => mutate('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id, data) => mutate(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (id) => mutate(`/members/${id}`, { method: 'DELETE' }),

  // Sprints
  createSprint: (data) => mutate('/sprints', { method: 'POST', body: JSON.stringify(data) }),
  updateSprint: (id, data) => mutate(`/sprints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSprint: (id) => mutate(`/sprints/${id}`, { method: 'DELETE' }),

  // Tasks
  createTask: (data) => mutate('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => mutate(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id) => mutate(`/tasks/${id}`, { method: 'DELETE' }),

  // Reviews
  createReview: (data) => mutate('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  updateReview: (id, data) => mutate(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Retros
  createRetro: (data) => mutate('/retros', { method: 'POST', body: JSON.stringify(data) }),
  updateRetro: (id, data) => mutate(`/retros/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Rules
  createRule: (data) => mutate('/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id, data) => mutate(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id) => mutate(`/rules/${id}`, { method: 'DELETE' }),
}
