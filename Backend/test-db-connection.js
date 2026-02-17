import pool from './config/database.js'

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log('Config:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'nira_db',
      user: process.env.DB_USER || 'postgres',
    })

    const client = await pool.connect()
    console.log('✅ Successfully connected to database!')

    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)

    console.log('\n📊 Existing tables:')
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found! Run database.sql to create tables.')
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`)
      })
    }

    // Check if users table exists and has correct structure
    if (tablesResult.rows.some(row => row.table_name === 'users')) {
      const usersCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `)
      console.log('\n👤 Users table structure:')
      usersCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      })
    }

    client.release()
    console.log('\n✅ Database connection test completed!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('\nTroubleshooting:')
    console.error('1. Is PostgreSQL running?')
    console.error('2. Does the database exist? Run: CREATE DATABASE nira_db;')
    console.error('3. Check your .env file credentials')
    console.error('4. Verify database name, user, and password')
    process.exit(1)
  }
}

testConnection()
