import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { organizations } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateParams, validateBody, updateOrganizationSchema } from '~/server/utils/validation'
import { auditUpdate } from '~/server/utils/audit'

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
    const body = await validateBody(event, updateOrganizationSchema)
    const db = useDb()

    // Get current org
    const currentOrg = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
    })

    if (!currentOrg) {
        throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    }

    // Check ownership or admin
    const isAdmin = ['admin', 'superadmin'].includes(payload.role)
    if (!isAdmin && currentOrg.ownerId !== parseInt(payload.sub)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Attach user context
    event.context.user = {
        id: parseInt(payload.sub),
        impersonatedBy: payload.impersonatedBy ? parseInt(payload.impersonatedBy) : undefined,
    }

    // Update
    const [updatedOrg] = await db.update(organizations)
        .set(body)
        .where(eq(organizations.id, id))
        .returning()

    // Audit
    await auditUpdate(event, 'organizations', id, currentOrg, body)

    return { organization: updatedOrg }
})

defineRouteMeta({
    openAPI: {
        tags: ['Organizations'],
        summary: 'Update organization',
        security: [{ bearerAuth: [] }],
    },
})
