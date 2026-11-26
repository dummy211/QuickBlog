import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import connectDB from './configs/db.js'
import adminRoutes from './routes/adminRoutes.js'
import blogRoutes from './routes/blogRoutes.js'
import healthRoutes from './routes/healthRoutes.js'

const app = express()
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: frontendOrigin }))
app.use(express.json())
app.use('/api/admin', adminRoutes)
app.use('/api/blog', blogRoutes)
app.use('/api/health', healthRoutes)

async function startServer() {
  const port = Number(process.env.PORT || 5000)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535')
  }

  await connectDB()

  const server = app.listen(port, () => {
    console.log(`QuickBlog API listening on port ${port}`)
  })

  server.on('error', (error) => {
    console.error(`Failed to start HTTP listener: ${error.message}`)
    process.exitCode = 1
  })
}

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`)
  process.exit(1)
})
