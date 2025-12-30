import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { faker } from '@faker-js/faker'
import { hash } from 'bcrypt'
import * as schema from '../schema'
import { users, organizations, projects, refreshTokens, auditLogs, organizationMembers } from '../schema'

const { Pool } = pg

// Configuration - loads from .env file
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saas_starter'
const SEED = 12345 // Fixed seed for deterministic data

// Initialize faker with seed
faker.seed(SEED)

async function main() {
    console.log('🌱 Starting database seeding...\n')

    const pool = new Pool({ connectionString: DATABASE_URL })
    const db = drizzle(pool, { schema })

    try {
        // Clear existing data (in reverse order due to foreign keys)
        console.log('🧹 Clearing existing data...')
        await db.delete(auditLogs)
        await db.delete(refreshTokens)
        await db.delete(projects)
        await db.delete(organizationMembers)
        await db.delete(organizations)
        await db.delete(users)
        console.log('   ✓ Data cleared\n')

        // Hash passwords
        const defaultPassword = await hash('password123', 12)
        const adminPassword = await hash('admin123', 12)
        const superadminPassword = await hash('superadmin123', 12)

        // Create Superadmin
        console.log('👑 Creating superadmin...')
        const [superadmin] = await db.insert(users).values({
            email: 'superadmin@example.com',
            password: superadminPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'superadmin',
            isActive: true,
            emailVerifiedAt: new Date(),
        }).returning()
        console.log(`   ✓ Superadmin created: ${superadmin.email} (password: superadmin123)\n`)

        // Create Admin users
        console.log('🔧 Creating admin users...')
        const adminUsers = []
        for (let i = 0; i < 3; i++) {
            const [admin] = await db.insert(users).values({
                email: `admin${i + 1}@example.com`,
                password: adminPassword,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                role: 'admin',
                isActive: true,
                emailVerifiedAt: new Date(),
            }).returning()
            adminUsers.push(admin)
            console.log(`   ✓ Admin: ${admin.email} (password: admin123)`)
        }
        console.log()

        // Create Regular users
        console.log('👤 Creating regular users...')
        const regularUsers = []
        for (let i = 0; i < 15; i++) {
            const [user] = await db.insert(users).values({
                email: faker.internet.email().toLowerCase(),
                password: defaultPassword,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                role: 'user',
                isActive: i < 13, // Make 2 users inactive for testing
                emailVerifiedAt: i < 12 ? new Date() : null, // Some unverified
            }).returning()
            regularUsers.push(user)
        }
        console.log(`   ✓ Created ${regularUsers.length} regular users (password: password123)\n`)

        // Combine all users for org creation
        const allUsers = [superadmin, ...adminUsers, ...regularUsers]

        // Create Organizations
        console.log('🏢 Creating organizations...')
        const createdOrgs = []
        const orgNames = [
            'Acme Corporation',
            'TechStart Inc',
            'Digital Dynamics',
            'Cloud Solutions Ltd',
            'Innovation Hub',
            'DataWave Systems',
            'FutureTech Labs',
            'Quantum Ventures',
        ]

        for (let i = 0; i < orgNames.length; i++) {
            const owner = allUsers[i % allUsers.length]
            const slug = orgNames[i].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')

            const [org] = await db.insert(organizations).values({
                name: orgNames[i],
                slug,
                description: faker.company.catchPhrase(),
                ownerId: owner.id,
            }).returning()
            createdOrgs.push(org)
            console.log(`   ✓ ${org.name} (owner: ${owner.email})`)
        }
        console.log()

        // Create Projects
        console.log('📋 Creating projects...')
        const projectStatuses: ('active' | 'archived' | 'completed')[] = ['active', 'archived', 'completed']
        let projectCount = 0

        for (const org of createdOrgs) {
            const numProjects = faker.number.int({ min: 2, max: 5 })

            for (let i = 0; i < numProjects; i++) {
                await db.insert(projects).values({
                    name: faker.commerce.productName(),
                    description: faker.lorem.paragraph(),
                    organizationId: org.id,
                    status: projectStatuses[faker.number.int({ min: 0, max: 2 })],
                })
                projectCount++
            }
        }
        console.log(`   ✓ Created ${projectCount} projects\n`)

        // Create Organization Members
        console.log('👥 Creating organization memberships...')
        let memberCount = 0

        for (const org of createdOrgs) {
            // Add 2-4 random members to each organization
            const numMembers = faker.number.int({ min: 2, max: 4 })
            const availableUsers = regularUsers.filter(u => u.id !== org.ownerId)
            const shuffled = availableUsers.sort(() => 0.5 - Math.random())
            const membersToAdd = shuffled.slice(0, numMembers)

            for (let i = 0; i < membersToAdd.length; i++) {
                const memberUser = membersToAdd[i]
                const role = i === 0 ? 'admin' : 'member' // First member is admin

                await db.insert(organizationMembers).values({
                    organizationId: org.id,
                    userId: memberUser.id,
                    role: role as 'admin' | 'member',
                    invitedById: org.ownerId,
                })
                memberCount++
            }
        }
        console.log(`   ✓ Created ${memberCount} organization memberships\n`)

        // Summary
        console.log('═══════════════════════════════════════════════════════════')
        console.log('                    SEEDING COMPLETE!                       ')
        console.log('═══════════════════════════════════════════════════════════')
        console.log()
        console.log('📊 Summary:')
        console.log(`   • Users:         ${allUsers.length} (1 superadmin, 3 admins, 15 regular)`)
        console.log(`   • Organizations: ${createdOrgs.length}`)
        console.log(`   • Projects:      ${projectCount}`)
        console.log()
        console.log('🔐 Login Credentials:')
        console.log('   ┌────────────────────────────────┬──────────────────┐')
        console.log('   │ Email                          │ Password         │')
        console.log('   ├────────────────────────────────┼──────────────────┤')
        console.log('   │ superadmin@example.com         │ superadmin123    │')
        console.log('   │ admin1@example.com             │ admin123         │')
        console.log('   │ admin2@example.com             │ admin123         │')
        console.log('   │ admin3@example.com             │ admin123         │')
        console.log('   │ (regular users)                │ password123      │')
        console.log('   └────────────────────────────────┴──────────────────┘')
        console.log()

    } catch (error) {
        console.error('❌ Seeding failed:', error)
        throw error
    } finally {
        await pool.end()
    }
}

main()
