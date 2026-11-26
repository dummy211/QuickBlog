import mongoose from 'mongoose'

async function connectDB() {
  const { MONGODB_URI } = process.env

  if (!MONGODB_URI) {
    throw new Error('Missing required environment variable: MONGODB_URI')
  }

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB connected')
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    throw new Error(`MongoDB connection failed: ${details}`)
  }
}

export default connectDB
