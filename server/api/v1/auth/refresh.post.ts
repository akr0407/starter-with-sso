import { eq, and, isNull, gt } from 'drizzle-orm'
import { users, refreshTokens } from '~/server/db/schema'
import {
    verifyRefreshToken,
    generateAccessToken,
    generateRefreshToken,
    generateTokenId,
    parseExpirationToMs
} from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    // Get refresh token from cookie
    const refreshTokenCookie = getCookie(event, 'refresh_token')

    if (!refreshTokenCookie) {
        throw createError({
            statusCode: 401,
            statusMessage: 'No refresh token',
            message: 'Refresh token is required',
        })
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshTokenCookie)
    if (!payload) {
        deleteCookie(event, 'refresh_token')
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid token',
            message: 'Refresh token is invalid or expired',
        })
    }

    const db = useDb()

    // Find the token in database
    const storedToken = await db.query.refreshTokens.findFirst({
        where: and(
            eq(refreshTokens.token, payload.tokenId),
            eq(refreshTokens.userId, parseInt(payload.sub)),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, new Date())
        ),
    })

    if (!storedToken) {
        deleteCookie(event, 'refresh_token')
        throw createError({
            statusCode: 401,
            statusMessage: 'Token revoked',
            message: 'Refresh token has been revoked',
        })
    }

    // Find the user
    const user = await db.query.users.findFirst({
        where: eq(users.id, storedToken.userId),
    })

    if (!user || !user.isActive) {
        deleteCookie(event, 'refresh_token')
        throw createError({
            statusCode: 401,
            statusMessage: 'User not found',
            message: 'User account not found or disabled',
        })
    }

    // Revoke old token
    await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, storedToken.id))

    // Generate new tokens
    const config = useRuntimeConfig()
    const newTokenId = generateTokenId()
    const accessToken = await generateAccessToken(user)
    const newRefreshToken = await generateRefreshToken(user.id, newTokenId)

    // Store new refresh token
    const refreshExpiration = new Date(Date.now() + parseExpirationToMs(config.jwtRefreshExpiration))
    await db.insert(refreshTokens).values({
        token: newTokenId,
        userId: user.id,
        expiresAt: refreshExpiration,
    })

    // Set new refresh token cookie
    setCookie(event, 'refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    })

    return {
        accessToken,
    }
})

// OpenAPI metadata
defineRouteMeta({
    openAPI: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Use refresh token cookie to obtain a new access token',
        responses: {
            200: { description: 'Token refreshed successfully' },
            401: { description: 'Invalid or expired refresh token' },
        },
    },
})
