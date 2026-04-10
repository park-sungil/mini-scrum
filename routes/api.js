const express = require('express')
const router = express.Router()
const db = require('../db/connection')
const oracledb = require('oracledb')

// GET /api/data — returns ALL data at once
router.get('/data', async (req, res) => {
  try {
    const [members, sprints, tasks, reviews, retros] = await Promise.all([
      db.execute('SELECT id, name, role, created_at FROM AT9.MINI_SCRUM_MEMBERS ORDER BY id'),
      db.execute(`SELECT id, title, goal,
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
        created_at FROM AT9.MINI_SCRUM_SPRINTS ORDER BY start_date DESC`),
      db.execute(`SELECT t.id, t.sprint_id, t.title, t.description,
        t.assignee_id, m.name AS assignee_name,
        t.status, t.priority,
        TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
        t.created_at, t.updated_at
        FROM AT9.MINI_SCRUM_TASKS t
        LEFT JOIN AT9.MINI_SCRUM_MEMBERS m ON t.assignee_id = m.id
        ORDER BY t.created_at`),
      db.execute(`SELECT r.id, r.sprint_id, s.title AS sprint_title,
        r.incomplete_reason, r.blockers, r.next_plan, r.created_at
        FROM AT9.MINI_SCRUM_REVIEWS r
        LEFT JOIN AT9.MINI_SCRUM_SPRINTS s ON r.sprint_id = s.id
        ORDER BY r.created_at DESC`),
      db.execute(`SELECT r.id, r.sprint_id, r.member_id, m.name AS member_name,
        r.keep_items, r.problem_items, r.try_items, r.created_at
        FROM AT9.MINI_SCRUM_RETROSPECTIVES r
        LEFT JOIN AT9.MINI_SCRUM_MEMBERS m ON r.member_id = m.id
        ORDER BY r.created_at`),
    ])
    res.json({
      members: members.rows,
      sprints: sprints.rows,
      tasks: tasks.rows,
      reviews: reviews.rows,
      retros: retros.rows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Members ---
router.post('/members', async (req, res) => {
  try {
    const { name, role } = req.body
    const result = await db.execute(
      'INSERT INTO AT9.MINI_SCRUM_MEMBERS (name, role) VALUES (:name, :role) RETURNING id INTO :id',
      { name, role: role || null, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
    )
    res.status(201).json({ id: result.outBinds.id[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/members/:id', async (req, res) => {
  try {
    const { name, role } = req.body
    await db.execute(
      'UPDATE AT9.MINI_SCRUM_MEMBERS SET name = :name, role = :role WHERE id = :id',
      { name, role: role || null, id: Number(req.params.id) }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/members/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM AT9.MINI_SCRUM_MEMBERS WHERE id = :id', { id: Number(req.params.id) })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Sprints ---
router.post('/sprints', async (req, res) => {
  try {
    const { title, goal, start_date, end_date } = req.body
    const overlap = await db.execute(
      `SELECT id, title FROM AT9.MINI_SCRUM_SPRINTS
       WHERE start_date <= TO_DATE(:end_date, 'YYYY-MM-DD')
         AND end_date >= TO_DATE(:start_date, 'YYYY-MM-DD')`,
      { start_date, end_date }
    )
    if (overlap.rows.length > 0) {
      return res.status(400).json({ error: `기간이 겹치는 스프린트가 있습니다: "${overlap.rows[0].title}"` })
    }
    const result = await db.execute(
      `INSERT INTO AT9.MINI_SCRUM_SPRINTS (title, goal, start_date, end_date)
       VALUES (:title, :goal, TO_DATE(:start_date, 'YYYY-MM-DD'), TO_DATE(:end_date, 'YYYY-MM-DD'))
       RETURNING id INTO :id`,
      { title, goal: goal || null, start_date, end_date, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
    )
    res.status(201).json({ id: result.outBinds.id[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/sprints/:id', async (req, res) => {
  try {
    const { title, goal, start_date, end_date } = req.body
    const overlap = await db.execute(
      `SELECT id, title FROM AT9.MINI_SCRUM_SPRINTS
       WHERE start_date <= TO_DATE(:end_date, 'YYYY-MM-DD')
         AND end_date >= TO_DATE(:start_date, 'YYYY-MM-DD')
         AND id != :id`,
      { start_date, end_date, id: Number(req.params.id) }
    )
    if (overlap.rows.length > 0) {
      return res.status(400).json({ error: `기간이 겹치는 스프린트가 있습니다: "${overlap.rows[0].title}"` })
    }
    await db.execute(
      `UPDATE AT9.MINI_SCRUM_SPRINTS SET title = :title, goal = :goal,
       start_date = TO_DATE(:start_date, 'YYYY-MM-DD'), end_date = TO_DATE(:end_date, 'YYYY-MM-DD')
       WHERE id = :id`,
      { title, goal: goal || null, start_date, end_date, id: Number(req.params.id) }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/sprints/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await db.execute('DELETE FROM AT9.MINI_SCRUM_RETROSPECTIVES WHERE sprint_id = :id', { id })
    await db.execute('DELETE FROM AT9.MINI_SCRUM_REVIEWS WHERE sprint_id = :id', { id })
    await db.execute('DELETE FROM AT9.MINI_SCRUM_TASKS WHERE sprint_id = :id', { id })
    await db.execute('DELETE FROM AT9.MINI_SCRUM_SPRINTS WHERE id = :id', { id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Tasks ---
router.post('/tasks', async (req, res) => {
  try {
    const { sprint_id, title, description, assignee_id, status, priority, due_date } = req.body
    const result = await db.execute(
      `INSERT INTO AT9.MINI_SCRUM_TASKS (sprint_id, title, description, assignee_id, status, priority, due_date)
       VALUES (:sprint_id, :title, :description, :assignee_id, :status, :priority,
               CASE WHEN :due_date IS NOT NULL THEN TO_DATE(:due_date2, 'YYYY-MM-DD') ELSE NULL END)
       RETURNING id INTO :id`,
      {
        sprint_id: Number(sprint_id), title, description: description || null,
        assignee_id: assignee_id ? Number(assignee_id) : null,
        status: status || 'todo', priority: priority || 'medium',
        due_date: due_date || null, due_date2: due_date || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    res.status(201).json({ id: result.outBinds.id[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/tasks/:id', async (req, res) => {
  try {
    const { title, description, assignee_id, status, priority, due_date, sprint_id } = req.body
    const updates = []
    const binds = { id: Number(req.params.id) }

    if (title !== undefined) { updates.push('title = :title'); binds.title = title }
    if (description !== undefined) { updates.push('description = :description'); binds.description = description || null }
    if (assignee_id !== undefined) { updates.push('assignee_id = :assignee_id'); binds.assignee_id = assignee_id ? Number(assignee_id) : null }
    if (status !== undefined) { updates.push('status = :status'); binds.status = status }
    if (priority !== undefined) { updates.push('priority = :priority'); binds.priority = priority }
    if (due_date !== undefined) {
      updates.push("due_date = CASE WHEN :due_date IS NOT NULL THEN TO_DATE(:due_date2, 'YYYY-MM-DD') ELSE NULL END")
      binds.due_date = due_date || null
      binds.due_date2 = due_date || null
    }
    if (sprint_id !== undefined) { updates.push('sprint_id = :sprint_id'); binds.sprint_id = Number(sprint_id) }
    updates.push('updated_at = CURRENT_TIMESTAMP')

    await db.execute(`UPDATE AT9.MINI_SCRUM_TASKS SET ${updates.join(', ')} WHERE id = :id`, binds)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/tasks/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM AT9.MINI_SCRUM_TASKS WHERE id = :id', { id: Number(req.params.id) })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Reviews ---
router.post('/reviews', async (req, res) => {
  try {
    const { sprint_id, incomplete_reason, blockers, next_plan } = req.body
    const result = await db.execute(
      `INSERT INTO AT9.MINI_SCRUM_REVIEWS (sprint_id, incomplete_reason, blockers, next_plan)
       VALUES (:sprint_id, :incomplete_reason, :blockers, :next_plan) RETURNING id INTO :id`,
      {
        sprint_id: Number(sprint_id),
        incomplete_reason: incomplete_reason || null, blockers: blockers || null, next_plan: next_plan || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    res.status(201).json({ id: result.outBinds.id[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/reviews/:id', async (req, res) => {
  try {
    const { incomplete_reason, blockers, next_plan } = req.body
    await db.execute(
      `UPDATE AT9.MINI_SCRUM_REVIEWS SET incomplete_reason = :incomplete_reason,
       blockers = :blockers, next_plan = :next_plan WHERE id = :id`,
      { incomplete_reason: incomplete_reason || null, blockers: blockers || null, next_plan: next_plan || null, id: Number(req.params.id) }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Retros ---
router.post('/retros', async (req, res) => {
  try {
    const { sprint_id, member_id, keep_items, problem_items, try_items } = req.body
    const result = await db.execute(
      `INSERT INTO AT9.MINI_SCRUM_RETROSPECTIVES (sprint_id, member_id, keep_items, problem_items, try_items)
       VALUES (:sprint_id, :member_id, :keep_items, :problem_items, :try_items) RETURNING id INTO :id`,
      {
        sprint_id: Number(sprint_id), member_id: member_id ? Number(member_id) : null,
        keep_items: keep_items || null, problem_items: problem_items || null, try_items: try_items || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    res.status(201).json({ id: result.outBinds.id[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/retros/:id', async (req, res) => {
  try {
    const { member_id, keep_items, problem_items, try_items } = req.body
    await db.execute(
      `UPDATE AT9.MINI_SCRUM_RETROSPECTIVES SET member_id = :member_id,
       keep_items = :keep_items, problem_items = :problem_items, try_items = :try_items WHERE id = :id`,
      { member_id: member_id ? Number(member_id) : null, keep_items: keep_items || null, problem_items: problem_items || null, try_items: try_items || null, id: Number(req.params.id) }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

module.exports = router
