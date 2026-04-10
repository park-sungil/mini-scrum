const express = require('express')
const router = express.Router()
const db = require('../db/connection')
const oracledb = require('oracledb')

// GET /api/retros?sprint_id=N
router.get('/', async (req, res) => {
  try {
    const { sprint_id } = req.query
    const result = await db.execute(
      `SELECT r.id, r.sprint_id, r.member_id, m.name AS member_name,
              r.keep_items, r.problem_items, r.try_items, r.created_at
       FROM AT9.MINI_SCRUM_RETROSPECTIVES r
       LEFT JOIN AT9.MINI_SCRUM_MEMBERS m ON r.member_id = m.id
       WHERE r.sprint_id = :sprint_id
       ORDER BY r.created_at`,
      { sprint_id: Number(sprint_id) }
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/retros
router.post('/', async (req, res) => {
  try {
    const { sprint_id, member_id, keep_items, problem_items, try_items } = req.body
    const result = await db.execute(
      `INSERT INTO AT9.MINI_SCRUM_RETROSPECTIVES (sprint_id, member_id, keep_items, problem_items, try_items)
       VALUES (:sprint_id, :member_id, :keep_items, :problem_items, :try_items)
       RETURNING id INTO :id`,
      {
        sprint_id: Number(sprint_id),
        member_id: member_id ? Number(member_id) : null,
        keep_items: keep_items || null,
        problem_items: problem_items || null,
        try_items: try_items || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    res.status(201).json({ id: result.outBinds.id[0], sprint_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/retros/:id
router.put('/:id', async (req, res) => {
  try {
    const { member_id, keep_items, problem_items, try_items } = req.body
    await db.execute(
      `UPDATE AT9.MINI_SCRUM_RETROSPECTIVES SET member_id = :member_id,
       keep_items = :keep_items, problem_items = :problem_items, try_items = :try_items
       WHERE id = :id`,
      {
        member_id: member_id ? Number(member_id) : null,
        keep_items: keep_items || null,
        problem_items: problem_items || null,
        try_items: try_items || null,
        id: Number(req.params.id),
      }
    )
    res.json({ id: Number(req.params.id), ...req.body })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
