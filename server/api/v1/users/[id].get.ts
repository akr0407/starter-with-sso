import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateParams } from '~/server/utils/validation'

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
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

    // Users can only view themselves unless admin
    if (!['admin', 'superadmin'].includes(payload.role) && parseInt(payload.sub) !== id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const db = useDb()

    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    if (!user) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return { user }
})

defineRouteMeta({
    openAPI: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
    },
})
