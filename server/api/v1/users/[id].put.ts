import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '~/server/db/schema'
import { verifyAccessToken, hashPassword } from '~/server/utils/auth'
import { validateParams, validateBody } from '~/server/utils/validation'
import { auditUpdate } from '~/server/utils/audit'

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
})

const updateUserSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    password: z.string().min(8).optional(),
    role: z.enum(['user', 'admin', 'superadmin']).optional(),
    isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const payload = await verifyAccessToken(authHeader.substring(7))
    if (!payload) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }

    const { id } = validateParams(event, paramsSchema)
    const body = await validateBody(event, updateUserSchema)

    // Check permissions
    const isAdmin = ['admin', 'superadmin'].includes(payload.role)
    const isSelf = parseInt(payload.sub) === id

    if (!isAdmin && !isSelf) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Only superadmin can change roles or deactivate accounts
    if ((body.role || body.isActive !== undefined) && payload.role !== 'superadmin') {
        throw createError({ statusCode: 403, statusMessage: 'Only superadmin can modify roles or account status' })
    }

    const db = useDb()

    // Get current user data for audit
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, id),
    })

    if (!currentUser) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (body.firstName) updateData.firstName = body.firstName
    if (body.lastName) updateData.lastName = body.lastName
    if (body.password) updateData.password = await hashPassword(body.password)
    if (body.role && payload.role === 'superadmin') updateData.role = body.role
    if (body.isActive !== undefined && payload.role === 'superadmin') updateData.isActive = body.isActive

    if (Object.keys(updateData).length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
    }

    // Attach user context for audit
    event.context.user = {
        id: parseInt(payload.sub),
        impersonatedBy: payload.impersonatedBy ? parseInt(payload.impersonatedBy) : undefined,
    }

    // Update user
    const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            isActive: users.isActive,
        })

    // Create audit log
    await auditUpdate(event, 'users', id,
        { ...currentUser, password: '[REDACTED]' },
        { ...updateData, password: updateData.password ? '[REDACTED]' : undefined }
    )

    return { user: updatedUser }
})

defineRouteMeta({
    openAPI: {
        tags: ['Users'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
    },
})
