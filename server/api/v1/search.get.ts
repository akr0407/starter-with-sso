import { sql, or, ilike } from 'drizzle-orm'
import { organizations, projects } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    // Get authorization header
    const authHeader = getHeader(event, 'authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Authorization header is required',
        })
    }

    const token = authHeader.substring(7)
    const payload = await verifyAccessToken(token)

    if (!payload) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid token',
            message: 'Access token is invalid or expired',
        })
    }

    // Get search query
    const query = getQuery(event)
    const q = (query.q as string || '').trim()

    if (!q || q.length < 2) {
        return {
            results: {
                organizations: [],
                projects: [],
            },
            total: 0,
        }
    }

    const db = useDb()
    const searchPattern = `%${q}%`

    // Search organizations
    const orgResults = await db
        .select({
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            description: organizations.description,
        })
        .from(organizations)
        .where(
            or(
                ilike(organizations.name, searchPattern),
                ilike(organizations.slug, searchPattern),
                ilike(organizations.description, searchPattern)
            )
        )
        .limit(5)

    // Search projects
    const projectResults = await db
        .select({
            id: projects.id,
            name: projects.name,
            status: projects.status,
            organizationId: projects.organizationId,
        })
        .from(projects)
        .where(
            or(
                ilike(projects.name, searchPattern),
                ilike(projects.description, searchPattern)
            )
        )
        .limit(5)

    return {
        results: {
            organizations: orgResults.map(org => ({
                ...org,
                type: 'organization',
                url: `/dashboard/organizations/${org.id}`,
            })),
            projects: projectResults.map(proj => ({
                ...proj,
                type: 'project',
                url: `/dashboard/projects/${proj.id}`,
            })),
        },
        total: orgResults.length + projectResults.length,
    }
})

// OpenAPI metadata
defineRouteMeta({
    openAPI: {
        tags: ['Search'],
        summary: 'Global search',
        description: 'Search across organizations and projects',
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: 'q',
                in: 'query',
                required: true,
                schema: { type: 'string', minLength: 2 },
                description: 'Search query (min 2 characters)',
            },
        ],
        responses: {
            200: { description: 'Search results' },
            401: { description: 'Unauthorized' },
        },
    },
})
