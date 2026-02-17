import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pkg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nira_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool optimization
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum pool size
  min: parseInt(process.env.DB_POOL_MIN) || 5,  // Minimum pool size
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000, // 2 seconds
  allowExitOnIdle: true,
})

// Test connection on startup
pool.connect()
  .then((client) => {
    console.log('✅ Connected to PostgreSQL database')
    console.log(`Database: ${process.env.DB_NAME || 'nira_db'}`)
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`)
    client.release()
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message)
    console.error('Please check:')
    console.error('1. PostgreSQL is running')
    console.error('2. Database exists: CREATE DATABASE nira_db;')
    console.error('3. .env file has correct credentials')
    console.error('4. Tables are created (run database.sql)')
  })

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    // process.exit(-1)
  }
})

export default pool
