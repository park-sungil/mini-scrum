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

export const api = {
  // Members
  getMembers: () => request('/members'),
  createMember: (data) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id, data) => request(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (id) => request(`/members/${id}`, { method: 'DELETE' }),

  // Sprints
  getSprints: () => request('/sprints'),
  getCurrentSprint: () => request('/sprints/current'),
  createSprint: (data) => request('/sprints', { method: 'POST', body: JSON.stringify(data) }),
  updateSprint: (id, data) => request(`/sprints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSprint: (id) => request(`/sprints/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (sprintId) => request(`/tasks?sprint_id=${sprintId}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Reviews
  getReviews: (sprintId) => request(`/reviews?sprint_id=${sprintId}`),
  getReviewList: () => request('/reviews'),
  createReview: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  updateReview: (id, data) => request(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Retrospectives
  getRetros: (sprintId) => request(`/retros?sprint_id=${sprintId}`),
  createRetro: (data) => request('/retros', { method: 'POST', body: JSON.stringify(data) }),
  updateRetro: (id, data) => request(`/retros/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard
  getDashboard: () => request('/dashboard'),
}
