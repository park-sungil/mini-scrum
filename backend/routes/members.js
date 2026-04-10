const express = require('express')
const router = express.Router()
const db = require('../db/connection')

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT id, name, role, created_at FROM members ORDER BY id'
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
      `INSERT INTO members (name, role) VALUES (:name, :role) RETURNING id INTO :id`,
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
      'UPDATE members SET name = :name, role = :role WHERE id = :id',
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
    await db.execute('DELETE FROM members WHERE id = :id', { id: Number(req.params.id) })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
