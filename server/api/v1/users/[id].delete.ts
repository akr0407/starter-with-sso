import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateParams } from '~/server/utils/validation'
import { auditDelete } from '~/server/utils/audit'

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
})

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const payload = await verifyAccessToken(authHeader.substring(7))
    if (!payload || payload.role !== 'superadmin') {
        throw createError({ statusCode: 403, statusMessage: 'Only superadmin can delete users' })
    }

    const { id } = validateParams(event, paramsSchema)

    // Prevent self-deletion
    if (parseInt(payload.sub) === id) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
    }

    const db = useDb()

    // Get user for audit
    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
    })

    if (!user) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Attach user context for audit
    event.context.user = {
        id: parseInt(payload.sub),
        impersonatedBy: payload.impersonatedBy ? parseInt(payload.impersonatedBy) : undefined,
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id))

    // Create audit log
    await auditDelete(event, 'users', id, { ...user, password: '[REDACTED]' })

    return { message: 'User deleted successfully' }
})

defineRouteMeta({
    openAPI: {
        tags: ['Users'],
        summary: 'Delete user',
        description: 'Delete a user (superadmin only)',
        security: [{ bearerAuth: [] }],
    },
})
