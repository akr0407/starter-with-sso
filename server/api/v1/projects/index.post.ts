import { eq } from 'drizzle-orm'
import { projects, organizations } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateBody, createProjectSchema } from '~/server/utils/validation'
import { auditInsert } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const payload = await verifyAccessToken(authHeader.substring(7))
    if (!payload) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }

    const body = await validateBody(event, createProjectSchema)
    const db = useDb()
    const userId = parseInt(payload.sub)

    // Check organization ownership
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, body.organizationId),
    })

    if (!org) {
        throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    }

    const isAdmin = ['admin', 'superadmin'].includes(payload.role)
    if (!isAdmin && org.ownerId !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Attach user context
    event.context.user = {
        id: userId,
        impersonatedBy: payload.impersonatedBy ? parseInt(payload.impersonatedBy) : undefined,
    }

    // Create project
    const [newProject] = await db.insert(projects).values({
        name: body.name,
        description: body.description,
        organizationId: body.organizationId,
    }).returning()

    // Audit
    await auditInsert(event, 'projects', newProject.id, newProject)

    return { project: newProject }
})

defineRouteMeta({
    openAPI: {
        tags: ['Projects'],
        summary: 'Create project',
        security: [{ bearerAuth: [] }],
    },
})
