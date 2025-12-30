import { count, eq, ilike, desc, asc } from 'drizzle-orm'
import { z } from 'zod'
import { organizations } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateQuery, paginationSchema } from '~/server/utils/validation'

const listOrgsSchema = paginationSchema.extend({
    search: z.string().optional(),
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

    const query = validateQuery(event, listOrgsSchema)
    const db = useDb()

    const isSuperadmin = payload.role === 'superadmin'
    const userId = parseInt(payload.sub)

    // Build where condition
    let whereCondition = isSuperadmin ? undefined : eq(organizations.ownerId, userId)

    if (query.search) {
        whereCondition = ilike(organizations.name, `%${query.search}%`)
    }

    // Get total count
    const [{ count: total }] = await db
        .select({ count: count() })
        .from(organizations)
        .where(whereCondition)

    // Get results with owner info
    const offset = (query.page - 1) * query.limit
    const results = await db.query.organizations.findMany({
        where: whereCondition,
        with: {
            owner: {
                columns: { id: true, email: true, firstName: true, lastName: true },
            },
        },
        orderBy: desc(organizations.createdAt),
        limit: query.limit,
        offset,
    })

    return {
        data: results,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    }
})

defineRouteMeta({
    openAPI: {
        tags: ['Organizations'],
        summary: 'List organizations',
        security: [{ bearerAuth: [] }],
    },
})
