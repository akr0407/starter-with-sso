import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { organizations } from '~/server/db/schema'
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
    if (!payload) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }

    const { id } = validateParams(event, paramsSchema)
    const db = useDb()

    // Get org
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    })

    if (!org) {
        throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    }

    // Check ownership or superadmin
    if (payload.role !== 'superadmin' && org.ownerId !== parseInt(payload.sub)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Attach user context
    event.context.user = {
        id: parseInt(payload.sub),
        impersonatedBy: payload.impersonatedBy ? parseInt(payload.impersonatedBy) : undefined,
    }

    // Delete
    await db.delete(organizations).where(eq(organizations.id, id))

    // Audit
    await auditDelete(event, 'organizations', id, org)

    return { message: 'Organization deleted successfully' }
})

defineRouteMeta({
    openAPI: {
        tags: ['Organizations'],
        summary: 'Delete organization',
        security: [{ bearerAuth: [] }],
    },
})
