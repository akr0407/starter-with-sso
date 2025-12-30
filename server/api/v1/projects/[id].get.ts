import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { projects } from '~/server/db/schema'
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

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
        with: {
            organization: {
                columns: { id: true, name: true, slug: true, ownerId: true },
            },
        },
    })

    if (!project) {
        throw createError({ statusCode: 404, statusMessage: 'Project not found' })
    }

    // Check access
    const isAdmin = ['admin', 'superadmin'].includes(payload.role)
    if (!isAdmin && project.organization.ownerId !== parseInt(payload.sub)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    return { project }
})

defineRouteMeta({
    openAPI: {
        tags: ['Projects'],
        summary: 'Get project by ID',
        security: [{ bearerAuth: [] }],
    },
})
