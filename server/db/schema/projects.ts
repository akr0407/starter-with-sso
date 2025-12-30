import { pgTable, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'

// Project status enum
export const projectStatusEnum = pgEnum('project_status', ['active', 'archived', 'completed'])

// Projects table
export const projects = pgTable('projects', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull(),
    description: text('description'),
    organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    status: projectStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})

// Project relations
export const projectsRelations = relations(projects, ({ one }) => ({
    organization: one(organizations, {
        fields: [projects.organizationId],
        references: [organizations.id],
    }),
}))

// Type exports
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
