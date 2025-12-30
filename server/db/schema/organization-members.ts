import { pgTable, text, timestamp, integer, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { organizations } from './organizations'

// Organization member role enum
export const orgMemberRoleEnum = pgEnum('org_member_role', ['owner', 'admin', 'member'])

// Organization Members junction table
export const organizationMembers = pgTable('organization_members', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: orgMemberRoleEnum('role').notNull().default('member'),
    invitedById: integer('invited_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    uniqueIndex('org_members_org_user_idx').on(table.organizationId, table.userId),
])

// Organization Members relations
export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
    organization: one(organizations, {
        fields: [organizationMembers.organizationId],
        references: [organizations.id],
    }),
    user: one(users, {
        fields: [organizationMembers.userId],
        references: [users.id],
        relationName: 'member_user',
    }),
    invitedBy: one(users, {
        fields: [organizationMembers.invitedById],
        references: [users.id],
        relationName: 'member_invited_by',
    }),
}))

// Type exports
export type OrganizationMember = typeof organizationMembers.$inferSelect
export type NewOrganizationMember = typeof organizationMembers.$inferInsert
