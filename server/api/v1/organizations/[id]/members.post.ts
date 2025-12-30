import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { organizationMembers, users, organizations } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'

const inviteMemberSchema = z.object({
    email: z.string().email().optional(),
    userId: z.number().optional(),
    role: z.enum(['admin', 'member']).default('member'),
}).refine(data => data.email || data.userId, {
    message: 'Either email or userId is required',
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

    // Get organization ID from params
    const orgId = parseInt(getRouterParam(event, 'id') || '')
    if (isNaN(orgId)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid organization ID' })
    }

    // Parse and validate body
    const body = await readBody(event)
    const parsed = inviteMemberSchema.safeParse(body)
    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0]?.message || 'Invalid request body' })
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
        throw createError({ statusCode: 403, statusMessage: 'Only admins can invite members' })
    }

    // Find the user to invite
    let targetUser
    if (parsed.data.userId) {
        targetUser = await db.query.users.findFirst({
            where: eq(users.id, parsed.data.userId),
        })
    } else if (parsed.data.email) {
        targetUser = await db.query.users.findFirst({
            where: eq(users.email, parsed.data.email),
        })
    }

    if (!targetUser) {
        throw createError({ statusCode: 404, statusMessage: 'User not found. They must have an account first.' })
    }

    // Check if user is already owner
    if (org.ownerId === targetUser.id) {
        throw createError({ statusCode: 400, statusMessage: 'User is already the owner of this organization' })
    }

    // Check if already a member
    const existingMember = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.organizationId, orgId),
            eq(organizationMembers.userId, targetUser.id),
        ),
    })

    if (existingMember) {
        throw createError({ statusCode: 400, statusMessage: 'User is already a member of this organization' })
    }

    // Add member
    const [newMember] = await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: targetUser.id,
        role: parsed.data.role,
        invitedById: userId,
    }).returning()

    return {
        member: {
            ...newMember,
            user: {
                id: targetUser.id,
                email: targetUser.email,
                firstName: targetUser.firstName,
                lastName: targetUser.lastName,
            },
        },
        message: 'Member added successfully',
    }
})
