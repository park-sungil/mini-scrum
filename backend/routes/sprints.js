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
       FROM sprints ORDER BY start_date DESC`
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
       FROM sprints
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
    const result = await db.execute(
      `INSERT INTO sprints (title, goal, start_date, end_date)
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
    await db.execute(
      `UPDATE sprints SET title = :title, goal = :goal,
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

module.exports = router
