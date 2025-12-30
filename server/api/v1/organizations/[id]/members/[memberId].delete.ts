import { eq, and } from 'drizzle-orm'
import { organizationMembers, organizations } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'

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

    const db = useDb()

    // Verify the organization exists
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
    })

    if (!org) {
        throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    }

    // Check if user is owner, admin member, or superadmin
    const isOwner = org.ownerId === userId
    const isSuperadmin = userRole === 'superadmin'

    const userMembership = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.organizationId, orgId),
            eq(organizationMembers.userId, userId),
        ),
    })

    const isAdmin = userMembership?.role === 'admin' || userMembership?.role === 'owner'

    if (!isSuperadmin && !isOwner && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Only admins can remove members' })
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

    // Prevent removing yourself (unless superadmin)
    if (member.userId === userId && !isSuperadmin) {
        throw createError({ statusCode: 400, statusMessage: 'You cannot remove yourself from the organization' })
    }

    // Delete the member
    await db.delete(organizationMembers)
        .where(eq(organizationMembers.id, memberId))

    return {
        message: 'Member removed successfully',
    }
})
