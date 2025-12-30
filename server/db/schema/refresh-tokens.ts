import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// Refresh tokens table for JWT refresh token storage
export const refreshTokens = pgTable('refresh_tokens', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    token: text('token').notNull().unique(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { mode: 'date', precision: 3, withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { mode: 'date', precision: 3, withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
})

// Refresh token relations
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, {
        fields: [refreshTokens.userId],
        references: [users.id],
    }),
}))

// Type exports
export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
