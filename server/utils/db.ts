import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../db/schema'

const { Pool } = pg

// Create a singleton pool for database connections
let pool: pg.Pool | null = null

function getPool(): pg.Pool {
    if (!pool) {
        const config = useRuntimeConfig()
        pool = new Pool({
            connectionString: config.databaseUrl,
            max: 10, // Maximum number of clients in the pool
        })
    }
    return pool
}

// Create Drizzle database instance with schema
export function useDb() {
    return drizzle(getPool(), { schema })
}

// Export for direct access (useful for seeding)
export function createDbClient(connectionString: string) {
    const directPool = new Pool({
        connectionString,
        max: 10,
    })
    return drizzle(directPool, { schema })
}

// Type helper for database instance
export type Database = ReturnType<typeof useDb>
