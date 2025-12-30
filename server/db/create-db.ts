import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

// Parse the DATABASE_URL to get connection info
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saas_starter'
const url = new URL(dbUrl)
const dbName = url.pathname.slice(1) // Remove leading /

// Connect to 'postgres' database to create the target database
const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`

async function createDatabase() {
    const client = new Client({ connectionString: adminUrl })

    try {
        await client.connect()
        console.log('🔌 Connected to PostgreSQL')

        // Check if database exists
        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        )

        if (result.rows.length === 0) {
            console.log(`📦 Creating database "${dbName}"...`)
            await client.query(`CREATE DATABASE ${dbName}`)
            console.log(`✅ Database "${dbName}" created successfully!`)
        } else {
            console.log(`✅ Database "${dbName}" already exists`)
        }
    } catch (error: any) {
        if (error.code === '42P04') {
            console.log(`✅ Database "${dbName}" already exists`)
        } else {
            console.error('❌ Error:', error.message)
            process.exit(1)
        }
    } finally {
        await client.end()
    }
}

createDatabase()
