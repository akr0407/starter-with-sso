import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { organizationMembers, organizations } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'

const updateRoleSchema = z.object({
    role: z.enum(['admin', 'member']),
})

export default defineEventHandler(async (event) => {
    // Require authentication
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const payload = await verifyAccessToken(authHeader.substring(7))
    if (!payload) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }

    const userId = parseInt(payload.sub)
    const userRole = payload.role

    // Get organization ID and member ID from params
    const orgId = parseInt(getRouterParam(event, 'id') || '')
    const memberId = parseInt(getRouterParam(event, 'memberId') || '')

    if (isNaN(orgId) || isNaN(memberId)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid organization or member ID' })
    }

    // Parse and validate body
    const body = await readBody(event)
    const parsed = updateRoleSchema.safeParse(body)
    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message || 'Invalid role' })
    }

    const db = useDb()

    // Verify the organization exists
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
    })

    if (!org) {
        throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    }

    // Check if user is owner or superadmin (only they can change roles)
    const isOwner = org.ownerId === userId
    const isSuperadmin = userRole === 'superadmin'

    if (!isSuperadmin && !isOwner) {
        throw createError({ statusCode: 403, statusMessage: 'Only the owner can change member roles' })
    }

    // Find the member
    const member = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.id, memberId),
            eq(organizationMembers.organizationId, orgId),
        ),
        with: {
            user: {
                columns: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    })

    if (!member) {
        throw createError({ statusCode: 404, statusMessage: 'Member not found' })
    }

    // Update the role
    const [updated] = await db.update(organizationMembers)
        .set({ role: parsed.data.role })
        .where(eq(organizationMembers.id, memberId))
        .returning()

    return {
        member: { ...updated, user: member.user },
        message: 'Role updated successfully',
    }
})
