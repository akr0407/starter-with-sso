import { eq, desc } from 'drizzle-orm'
import { auditLogs } from '~/server/db/schema'
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

    const userId = parseInt(payload.sub)
    const db = useDb()

    // Get query params
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 10, 50)

    // Fetch recent activity for the user
    const activities = await db.query.auditLogs.findMany({
        where: eq(auditLogs.userId, userId),
        orderBy: [desc(auditLogs.createdAt)],
        limit,
        columns: {
            id: true,
            tableName: true,
            action: true,
            recordId: true,
            createdAt: true,
        },
    })

    // Format activities for display
    const formattedActivities = activities.map(activity => ({
        id: activity.id,
        table: activity.tableName,
        action: activity.action,
        recordId: activity.recordId,
        description: formatActivityDescription(activity.action, activity.tableName),
        createdAt: activity.createdAt,
    }))

    return {
        activities: formattedActivities,
    }
})

// Helper to format activity descriptions
function formatActivityDescription(action: string, table: string): string {
    const tableLabels: Record<string, string> = {
        users: 'user',
        organizations: 'organization',
        projects: 'project',
    }

    const tableLabel = tableLabels[table] || table

    switch (action) {
        case 'INSERT':
            return `Created a new ${tableLabel}`
        case 'UPDATE':
            return `Updated a ${tableLabel}`
        case 'DELETE':
            return `Deleted a ${tableLabel}`
        case 'VIEW':
            return `Viewed ${tableLabel} details`
        default:
            return `${action} on ${tableLabel}`
    }
}

// OpenAPI metadata
defineRouteMeta({
    openAPI: {
        tags: ['Users'],
        summary: 'Get user activity feed',
        description: 'Returns recent activity for the authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: 'limit',
                in: 'query',
                schema: { type: 'integer', default: 10, maximum: 50 },
                description: 'Number of activities to return',
            },
        ],
        responses: {
            200: { description: 'Activity feed retrieved' },
            401: { description: 'Unauthorized' },
        },
    },
})
