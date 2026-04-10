const express = require('express')
const router = express.Router()
const db = require('../db/connection')
const oracledb = require('oracledb')

// GET /api/tasks?sprint_id=N
router.get('/', async (req, res) => {
  try {
    const { sprint_id } = req.query
    const result = await db.execute(
      `SELECT t.id, t.sprint_id, t.title, t.description,
              t.assignee_id, m.name AS assignee_name,
              t.status, t.priority,
              TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
              t.created_at, t.updated_at
       FROM tasks t
       LEFT JOIN members m ON t.assignee_id = m.id
       WHERE t.sprint_id = :sprint_id
       ORDER BY
         CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.created_at`,
      { sprint_id: Number(sprint_id) }
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { sprint_id, title, description, assignee_id, status, priority, due_date } = req.body
    const result = await db.execute(
      `INSERT INTO tasks (sprint_id, title, description, assignee_id, status, priority, due_date)
       VALUES (:sprint_id, :title, :description, :assignee_id, :status, :priority,
               CASE WHEN :due_date IS NOT NULL THEN TO_DATE(:due_date2, 'YYYY-MM-DD') ELSE NULL END)
       RETURNING id INTO :id`,
      {
        sprint_id: Number(sprint_id),
        title,
        description: description || null,
        assignee_id: assignee_id ? Number(assignee_id) : null,
        status: status || 'todo',
        priority: priority || 'medium',
        due_date: due_date || null,
        due_date2: due_date || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    res.status(201).json({ id: result.outBinds.id[0], title, status: status || 'todo' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, assignee_id, status, priority, due_date, sprint_id } = req.body

    // Build dynamic update
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

    await db.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = :id`,
      binds
    )
    res.json({ id: Number(req.params.id), ...req.body })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM tasks WHERE id = :id', { id: Number(req.params.id) })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
