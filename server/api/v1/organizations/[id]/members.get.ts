import { eq } from 'drizzle-orm'
import { organizationMembers, users, organizations } from '~/server/db/schema'
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

    // Get organization ID from params
    const orgId = parseInt(getRouterParam(event, 'id') || '')
    if (isNaN(orgId)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid organization ID' })
    }

    const db = useDb()

    // Verify the organization exists and user has access
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
    })

    if (!org) {
        throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    }

    // Check if user is owner, admin, or superadmin
    const isOwner = org.ownerId === userId
    const isSuperadmin = userRole === 'superadmin'

    // Check membership
    const membership = await db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.organizationId, orgId),
    })

    if (!isSuperadmin && !isOwner && !membership) {
        throw createError({ statusCode: 403, statusMessage: 'Access denied' })
    }

    // Fetch all members with user details
    const members = await db.query.organizationMembers.findMany({
        where: eq(organizationMembers.organizationId, orgId),
        with: {
            user: {
                columns: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                },
            },
            invitedBy: {
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: (members, { asc }) => [asc(members.createdAt)],
    })

    // Also include the owner as a special "member"
    const owner = await db.query.users.findFirst({
        where: eq(users.id, org.ownerId),
        columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
        },
    })

    // Create owner pseudo-member
    const ownerMember = owner ? {
        id: 0, // Special ID for owner
        organizationId: orgId,
        userId: owner.id,
        role: 'owner' as const,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        user: owner,
        invitedBy: null,
        isOwner: true,
    } : null

    // Combine owner with members (owner first)
    const allMembers = ownerMember
        ? [ownerMember, ...members.map(m => ({ ...m, isOwner: false }))]
        : members.map(m => ({ ...m, isOwner: false }))

    return {
        members: allMembers,
        total: allMembers.length,
    }
})
