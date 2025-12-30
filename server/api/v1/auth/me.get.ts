import { eq } from 'drizzle-orm'
import { users } from '~/server/db/schema'
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

    const db = useDb()

    // Find the user
    const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(payload.sub)),
    })

    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
            message: 'User account not found',
        })
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            preferences: user.preferences || {},
            createdAt: user.createdAt,
        },
        isImpersonating: payload.isImpersonating ?? false,
        impersonatedBy: payload.impersonatedBy ? parseInt(payload.impersonatedBy) : null,
    }
})

// OpenAPI metadata
defineRouteMeta({
    openAPI: {
        tags: ['Authentication'],
        summary: 'Get current user',
        description: 'Get authenticated user profile information',
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: 'User profile retrieved' },
            401: { description: 'Unauthorized' },
        },
    },
})
