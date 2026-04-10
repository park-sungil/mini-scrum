require('dotenv').config()
const express = require('express')
const path = require('path')
const db = require('./db/connection')
const apiRouter = require('./routes/api')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// API routes
app.use('/api', apiRouter)

// Serve Vue frontend (built files)
app.use(express.static(path.join(__dirname, 'app', 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'dist', 'index.html'))
})

async function start() {
  try {
    await db.initialize()
    app.listen(PORT, () => {
      console.log(`Mini Scrum running on http://localhost:${PORT}`)
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
