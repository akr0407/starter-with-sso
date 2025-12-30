import { eq } from 'drizzle-orm'
import { refreshTokens } from '~/server/db/schema'
import { verifyRefreshToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    // Get refresh token from cookie
    const refreshTokenCookie = getCookie(event, 'refresh_token')

    if (refreshTokenCookie) {
        // Verify and revoke the token
        const payload = await verifyRefreshToken(refreshTokenCookie)

        if (payload) {
            const db = useDb()

            // Revoke the token
            await db.update(refreshTokens)
                .set({ revokedAt: new Date() })
                .where(eq(refreshTokens.token, payload.tokenId))
        }
    }

    // Delete the cookie
    deleteCookie(event, 'refresh_token')

    return {
        message: 'Logged out successfully',
    }
})

// OpenAPI metadata
defineRouteMeta({
    openAPI: {
        tags: ['Authentication'],
        summary: 'Logout user',
        description: 'Revoke refresh token and clear authentication cookies',
        responses: {
            200: { description: 'Logged out successfully' },
        },
    },
})
