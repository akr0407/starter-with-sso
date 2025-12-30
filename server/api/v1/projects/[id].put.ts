import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { projects } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateParams, validateBody, updateProjectSchema } from '~/server/utils/validation'
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
    if (!payload) throw createError({ statusCode: 401, statusMessage: 'Invalid token' })

    const { id } = validateParams(event, paramsSchema)
    const body = await validateBody(event, updateProjectSchema)
    const db = useDb()

    const currentProject = await db.query.projects.findFirst({
        where: eq(projects.id, id),
        with: { organization: { columns: { ownerId: true } } },
    })

    if (!currentProject) throw createError({ statusCode: 404, statusMessage: 'Project not found' })

    const isAdmin = ['admin', 'superadmin'].includes(payload.role)
    if (!isAdmin && currentProject.organization.ownerId !== parseInt(payload.sub)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    event.context.user = {
        id: parseInt(payload.sub),
        impersonatedBy: payload.impersonatedBy ? parseInt(payload.impersonatedBy) : undefined,
    }

    const [updatedProject] = await db.update(projects).set(body).where(eq(projects.id, id)).returning()
    await auditUpdate(event, 'projects', id, currentProject, body)

    return { project: updatedProject }
})

defineRouteMeta({ openAPI: { tags: ['Projects'], summary: 'Update project', security: [{ bearerAuth: [] }] } })
