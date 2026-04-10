require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./db/connection')

const membersRouter = require('./routes/members')
const sprintsRouter = require('./routes/sprints')
const tasksRouter = require('./routes/tasks')
const reviewsRouter = require('./routes/reviews')
const retrosRouter = require('./routes/retros')
const dashboardRouter = require('./routes/dashboard')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/members', membersRouter)
app.use('/api/sprints', sprintsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/retros', retrosRouter)
app.use('/api/dashboard', dashboardRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

async function start() {
  try {
    await db.initialize()
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  await db.close()
  process.exit(0)
})

start()
