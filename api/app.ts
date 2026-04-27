/**
 * This is the API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import roboflowRoutes from './routes/roboflow.js'
import schedulesRoutes from './routes/schedules.js'
import iotRoutes from './routes/iot.js'
import weatherRoutes from './routes/weather.js'
import plantsRoutes from './routes/plants.js'

// load env
{
  const here = path.dirname(fileURLToPath(import.meta.url))
  dotenv.config({ path: path.resolve(here, '../.env') })
}

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// API routes
app.use('/api/roboflow', roboflowRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use('/api/iot', iotRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/plants', plantsRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
