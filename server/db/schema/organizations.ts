import { pgTable, text, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { projects } from './projects'
import { organizationMembers } from './organization-members'

// Organizations table
export const organizations = pgTable('organizations', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    uniqueIndex('organizations_slug_idx').on(table.slug),
])

// Organization relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
    owner: one(users, {
        fields: [organizations.ownerId],
        references: [users.id],
    }),
    projects: many(projects),
    members: many(organizationMembers),
}))

// Type exports
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
