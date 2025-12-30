import { count, eq, ilike, or, desc, asc } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateQuery, paginationSchema } from '~/server/utils/validation'

const listUsersSchema = paginationSchema.extend({
    search: z.string().optional(),
    role: z.enum(['user', 'admin', 'superadmin']).optional(),
    sortBy: z.enum(['createdAt', 'email', 'firstName']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export default defineEventHandler(async (event) => {
    // Require admin or superadmin
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const payload = await verifyAccessToken(authHeader.substring(7))
    if (!payload || payload.role !== 'superadmin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const query = validateQuery(event, listUsersSchema)
    const db = useDb()

    // Build where conditions
    const conditions = []

    if (query.search) {
        conditions.push(
            or(
                ilike(users.email, `%${query.search}%`),
                ilike(users.firstName, `%${query.search}%`),
                ilike(users.lastName, `%${query.search}%`)
            )
        )
    }

    if (query.role) {
        conditions.push(eq(users.role, query.role))
    }

    // Get total count
    const [{ count: total }] = await db
        .select({ count: count() })
        .from(users)
        .where(conditions.length ? conditions[0] : undefined)

    // Get paginated results
    const offset = (query.page - 1) * query.limit
    const sortColumn = query.sortBy === 'email' ? users.email
        : query.sortBy === 'firstName' ? users.firstName
            : users.createdAt

    const results = await db.query.users.findMany({
        where: conditions.length ? conditions[0] : undefined,
        columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: query.sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn),
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
        tags: ['Users'],
        summary: 'List users',
        description: 'Get paginated list of users (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['user', 'admin', 'superadmin'] } },
        ],
    },
})
