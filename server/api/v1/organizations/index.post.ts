import { eq } from 'drizzle-orm'
import { organizations } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateBody, createOrganizationSchema } from '~/server/utils/validation'
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

    const body = await validateBody(event, createOrganizationSchema)
    const db = useDb()
    const userId = parseInt(payload.sub)

    // Check if slug already exists
    const existingOrg = await db.query.organizations.findFirst({
        where: eq(organizations.slug, body.slug.toLowerCase()),
    })

    if (existingOrg) {
        throw createError({ statusCode: 409, statusMessage: 'Organization slug already exists' })
    }

    // Attach user context for audit
    event.context.user = {
        id: userId,
        impersonatedBy: payload.impersonatedBy ? parseInt(payload.impersonatedBy) : undefined,
    }

    // Create organization
    const [newOrg] = await db.insert(organizations).values({
        name: body.name,
        slug: body.slug.toLowerCase(),
        description: body.description,
        ownerId: userId,
    }).returning()

    // Create audit log
    await auditInsert(event, 'organizations', newOrg.id, newOrg)

    return { organization: newOrg }
})

defineRouteMeta({
    openAPI: {
        tags: ['Organizations'],
        summary: 'Create organization',
        security: [{ bearerAuth: [] }],
    },
})
