import { eq } from 'drizzle-orm'
import { users, type UserPreferences } from '~/server/db/schema'
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

    // Parse request body
    const body = await readBody<{ preferences: Partial<UserPreferences> }>(event)

    if (!body?.preferences) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Preferences object is required',
        })
    }

    const db = useDb()

    // Get current user preferences
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(payload.sub)),
        columns: { preferences: true },
    })

    if (!currentUser) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
        })
    }

    // Merge preferences (deep merge for theme object)
    const currentPrefs = (currentUser.preferences || {}) as UserPreferences
    const newPrefs: UserPreferences = {
        ...currentPrefs,
        theme: {
            ...currentPrefs.theme,
            ...body.preferences.theme,
        },
    }

    // Update user preferences
    const [updatedUser] = await db
        .update(users)
        .set({ preferences: newPrefs })
        .where(eq(users.id, parseInt(payload.sub)))
        .returning({ preferences: users.preferences })

    return {
        message: 'Preferences updated successfully',
        preferences: updatedUser.preferences,
    }
})

// OpenAPI metadata
defineRouteMeta({
    openAPI: {
        tags: ['Users'],
        summary: 'Update user preferences',
        description: 'Update the current user\'s preferences (theme, etc.)',
        security: [{ bearerAuth: [] }],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            preferences: {
                                type: 'object',
                                properties: {
                                    theme: {
                                        type: 'object',
                                        properties: {
                                            primaryColor: { type: 'string', example: '#6366f1' },
                                            mode: { type: 'string', enum: ['dark', 'light'] },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            200: { description: 'Preferences updated successfully' },
            400: { description: 'Bad request' },
            401: { description: 'Unauthorized' },
        },
    },
})
