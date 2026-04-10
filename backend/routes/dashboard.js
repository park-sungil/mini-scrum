const express = require('express')
const router = express.Router()
const db = require('../db/connection')

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    // Get current sprint
    const sprintResult = await db.execute(
      `SELECT id, title, goal,
              TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
              TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date
       FROM AT9.MINI_SCRUM_SPRINTS
       WHERE start_date <= TRUNC(SYSDATE) AND end_date >= TRUNC(SYSDATE)
       ORDER BY start_date DESC
       FETCH FIRST 1 ROW ONLY`
    )
    const currentSprint = sprintResult.rows[0] || null

    if (!currentSprint) {
      return res.json({ currentSprint: null, taskSummary: null, memberTasks: [] })
    }

    // Task summary
    const summaryResult = await db.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) AS todo,
         SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
         SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
       FROM AT9.MINI_SCRUM_TASKS WHERE sprint_id = :sprint_id`,
      { sprint_id: currentSprint.id }
    )
    const taskSummary = summaryResult.rows[0]

    // Member tasks
    const memberResult = await db.execute(
      `SELECT m.id, m.name,
              SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todo,
              SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
              SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS done
       FROM AT9.MINI_SCRUM_MEMBERS m
       LEFT JOIN AT9.MINI_SCRUM_TASKS t ON m.id = t.assignee_id AND t.sprint_id = :sprint_id
       GROUP BY m.id, m.name
       ORDER BY m.name`,
      { sprint_id: currentSprint.id }
    )

    res.json({
      currentSprint,
      taskSummary,
      memberTasks: memberResult.rows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
