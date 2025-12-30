import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { auditLogs } from '~/server/db/schema'
import { verifyAccessToken } from '~/server/utils/auth'
import { validateQuery, paginationSchema } from '~/server/utils/validation'

const listAuditLogsSchema = paginationSchema.extend({
    tableName: z.string().optional(),
    action: z.enum(['INSERT', 'UPDATE', 'DELETE', 'VIEW']).optional(),
    userId: z.coerce.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const payload = await verifyAccessToken(authHeader.substring(7))
    if (!payload || !['admin', 'superadmin'].includes(payload.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const query = validateQuery(event, listAuditLogsSchema)
    const db = useDb()

    // Build conditions
    const conditions = []
    if (query.tableName) conditions.push(eq(auditLogs.tableName, query.tableName))
    if (query.action) conditions.push(eq(auditLogs.action, query.action))
    if (query.userId) conditions.push(eq(auditLogs.userId, query.userId))

    // Get total count
    const [{ count: total }] = await db
        .select({ count: count() })
        .from(auditLogs)
        .where(conditions.length === 1 ? conditions[0] : undefined)

    // Get results with user info
    const offset = (query.page - 1) * query.limit
    const results = await db.query.auditLogs.findMany({
        where: conditions.length === 1 ? conditions[0] : undefined,
        with: {
            user: { columns: { id: true, email: true, firstName: true, lastName: true } },
            impersonator: { columns: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: desc(auditLogs.createdAt),
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
        tags: ['Admin'],
        summary: 'List audit logs',
        description: 'Get paginated audit logs (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'tableName', in: 'query', schema: { type: 'string' } },
            { name: 'action', in: 'query', schema: { type: 'string', enum: ['INSERT', 'UPDATE', 'DELETE'] } },
        ],
    },
})
