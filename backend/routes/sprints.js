const express = require('express')
const router = express.Router()
const db = require('../db/connection')
const oracledb = require('oracledb')

// GET /api/sprints
router.get('/', async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT id, title, goal,
              TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
              TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
              created_at
       FROM AT9.MINI_SCRUM_SPRINTS ORDER BY start_date DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sprints/current
router.get('/current', async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT id, title, goal,
              TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
              TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date
       FROM AT9.MINI_SCRUM_SPRINTS
       WHERE start_date <= TRUNC(SYSDATE) AND end_date >= TRUNC(SYSDATE)
       ORDER BY start_date DESC
       FETCH FIRST 1 ROW ONLY`
    )
    res.json(result.rows[0] || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sprints
router.post('/', async (req, res) => {
  try {
    const { title, goal, start_date, end_date } = req.body

    // Check for overlapping sprints
    const overlap = await db.execute(
      `SELECT id, title FROM AT9.MINI_SCRUM_SPRINTS
       WHERE start_date <= TO_DATE(:end_date, 'YYYY-MM-DD')
         AND end_date >= TO_DATE(:start_date, 'YYYY-MM-DD')`,
      { start_date, end_date }
    )
    if (overlap.rows.length > 0) {
      return res.status(400).json({
        error: `기간이 겹치는 스프린트가 있습니다: "${overlap.rows[0].title}"`
      })
    }

    const result = await db.execute(
      `INSERT INTO AT9.MINI_SCRUM_SPRINTS (title, goal, start_date, end_date)
       VALUES (:title, :goal, TO_DATE(:start_date, 'YYYY-MM-DD'), TO_DATE(:end_date, 'YYYY-MM-DD'))
       RETURNING id INTO :id`,
      {
        title,
        goal: goal || null,
        start_date,
        end_date,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    res.status(201).json({ id: result.outBinds.id[0], title, goal, start_date, end_date })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/sprints/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, goal, start_date, end_date } = req.body

    // Check for overlapping sprints (exclude self)
    const overlap = await db.execute(
      `SELECT id, title FROM AT9.MINI_SCRUM_SPRINTS
       WHERE start_date <= TO_DATE(:end_date, 'YYYY-MM-DD')
         AND end_date >= TO_DATE(:start_date, 'YYYY-MM-DD')
         AND id != :id`,
      { start_date, end_date, id: Number(req.params.id) }
    )
    if (overlap.rows.length > 0) {
      return res.status(400).json({
        error: `기간이 겹치는 스프린트가 있습니다: "${overlap.rows[0].title}"`
      })
    }

    await db.execute(
      `UPDATE AT9.MINI_SCRUM_SPRINTS SET title = :title, goal = :goal,
       start_date = TO_DATE(:start_date, 'YYYY-MM-DD'),
       end_date = TO_DATE(:end_date, 'YYYY-MM-DD')
       WHERE id = :id`,
      { title, goal: goal || null, start_date, end_date, id: Number(req.params.id) }
    )
    res.json({ id: Number(req.params.id), title, goal, start_date, end_date })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/sprints/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    // Delete related data first (tasks, reviews, retrospectives)
    await db.execute('DELETE FROM AT9.MINI_SCRUM_RETROSPECTIVES WHERE sprint_id = :id', { id })
    await db.execute('DELETE FROM AT9.MINI_SCRUM_REVIEWS WHERE sprint_id = :id', { id })
    await db.execute('DELETE FROM AT9.MINI_SCRUM_TASKS WHERE sprint_id = :id', { id })
    await db.execute('DELETE FROM AT9.MINI_SCRUM_SPRINTS WHERE id = :id', { id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
