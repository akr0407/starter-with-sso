import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { organizations } from '~/server/db/schema'
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
    const db = useDb()

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
        with: {
            owner: {
                columns: { id: true, email: true, firstName: true, lastName: true },
            },
            projects: true,
        },
    })

    if (!org) {
        throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    }

    // Check access - admins can view all, others only their own
    const isAdmin = ['admin', 'superadmin'].includes(payload.role)
    if (!isAdmin && org.ownerId !== parseInt(payload.sub)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    return { organization: org }
})

defineRouteMeta({
    openAPI: {
        tags: ['Organizations'],
        summary: 'Get organization by ID',
        security: [{ bearerAuth: [] }],
    },
})
