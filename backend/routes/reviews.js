const express = require('express')
const router = express.Router()
const db = require('../db/connection')
const oracledb = require('oracledb')

// GET /api/reviews?sprint_id=N
router.get('/', async (req, res) => {
  try {
    const { sprint_id } = req.query
    let sql = `SELECT r.id, r.sprint_id, s.title AS sprint_title,
                      r.incomplete_reason, r.blockers, r.next_plan, r.created_at
               FROM AT9.MINI_SCRUM_REVIEWS r
               LEFT JOIN AT9.MINI_SCRUM_SPRINTS s ON r.sprint_id = s.id`
    const binds = {}

    if (sprint_id) {
      sql += ' WHERE r.sprint_id = :sprint_id'
      binds.sprint_id = Number(sprint_id)
    }
    sql += ' ORDER BY r.created_at DESC'

    const result = await db.execute(sql, binds)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const { sprint_id, incomplete_reason, blockers, next_plan } = req.body
    const result = await db.execute(
      `INSERT INTO AT9.MINI_SCRUM_REVIEWS (sprint_id, incomplete_reason, blockers, next_plan)
       VALUES (:sprint_id, :incomplete_reason, :blockers, :next_plan)
       RETURNING id INTO :id`,
      {
        sprint_id: Number(sprint_id),
        incomplete_reason: incomplete_reason || null,
        blockers: blockers || null,
        next_plan: next_plan || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    res.status(201).json({ id: result.outBinds.id[0], sprint_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/reviews/:id
router.put('/:id', async (req, res) => {
  try {
    const { incomplete_reason, blockers, next_plan } = req.body
    await db.execute(
      `UPDATE AT9.MINI_SCRUM_REVIEWS SET incomplete_reason = :incomplete_reason,
       blockers = :blockers, next_plan = :next_plan
       WHERE id = :id`,
      {
        incomplete_reason: incomplete_reason || null,
        blockers: blockers || null,
        next_plan: next_plan || null,
        id: Number(req.params.id),
      }
    )
    res.json({ id: Number(req.params.id), ...req.body })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
