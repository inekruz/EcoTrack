import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js';
import foodEntryRoutes from './routes/foodEntryRoutes.js';
import statRoutes from './routes/statRoutes.js';

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes);
app.use('/api/foodEntry', foodEntryRoutes)
app.use('/api/stat', statRoutes)

// testing
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EcoTrack API is running 🚀'
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server started: ${PORT}`)
})
