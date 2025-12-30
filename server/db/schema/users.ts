import { pgTable, text, timestamp, boolean, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Role enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'superadmin'])

// User preferences type
export interface UserPreferences {
    theme?: {
        primaryColor?: string // e.g., '#6366f1'
        mode?: 'dark' | 'light'
    }
}

// Users table
export const users = pgTable('users', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    isActive: boolean('is_active').notNull().default(true),
    preferences: jsonb('preferences').$type<UserPreferences>().default({}),
    emailVerifiedAt: timestamp('email_verified_at', { mode: 'date', precision: 3, withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})

// User relations
export const usersRelations = relations(users, ({ many }) => ({
    ownedOrganizations: many(organizations),
    refreshTokens: many(refreshTokens),
    auditLogs: many(auditLogs, { relationName: 'audit_logs_user' }),
    impersonatedAuditLogs: many(auditLogs, { relationName: 'audit_logs_impersonator' }),
    organizationMemberships: many(organizationMembers, { relationName: 'member_user' }),
}))

// Import related tables for type inference
import { organizations } from './organizations'
import { refreshTokens } from './refresh-tokens'
import { auditLogs } from './audit-logs'
import { organizationMembers } from './organization-members'

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
