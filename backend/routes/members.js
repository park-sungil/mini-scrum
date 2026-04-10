const express = require('express')
const router = express.Router()
const db = require('../db/connection')

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT id, name, role, created_at FROM AT9.MINI_SCRUM_MEMBERS ORDER BY id'
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/members
router.post('/', async (req, res) => {
  try {
    const { name, role } = req.body
    const result = await db.execute(
      `INSERT INTO AT9.MINI_SCRUM_MEMBERS (name, role) VALUES (:name, :role) RETURNING id INTO :id`,
      {
        name,
        role: role || null,
        id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER },
      }
    )
    res.status(201).json({ id: result.outBinds.id[0], name, role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, role } = req.body
    await db.execute(
      'UPDATE AT9.MINI_SCRUM_MEMBERS SET name = :name, role = :role WHERE id = :id',
      { name, role: role || null, id: Number(req.params.id) }
    )
    res.json({ id: Number(req.params.id), name, role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM AT9.MINI_SCRUM_MEMBERS WHERE id = :id', { id: Number(req.params.id) })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
