import { pgTable, text, timestamp, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// Audit action enum (VIEW added for tracking GET requests)
export const auditActionEnum = pgEnum('audit_action', ['INSERT', 'UPDATE', 'DELETE', 'VIEW'])

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    tableName: text('table_name').notNull(),
    action: auditActionEnum('action').notNull(),
    recordId: integer('record_id').notNull(),
    oldData: jsonb('old_data'),
    newData: jsonb('new_data'),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    impersonatedBy: integer('impersonated_by').references(() => users.id, { onDelete: 'set null' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
})

// Audit log relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
        relationName: 'audit_logs_user',
    }),
    impersonator: one(users, {
        fields: [auditLogs.impersonatedBy],
        references: [users.id],
        relationName: 'audit_logs_impersonator',
    }),
}))

// Type exports
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
