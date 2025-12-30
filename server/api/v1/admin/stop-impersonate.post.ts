import { eq } from 'drizzle-orm'
import { users, refreshTokens } from '~/server/db/schema'
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, generateRefreshToken, generateTokenId, parseExpirationToMs } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const payload = await verifyAccessToken(authHeader.substring(7))
    if (!payload) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }

    if (!payload.isImpersonating || !payload.impersonatedBy) {
        throw createError({ statusCode: 400, statusMessage: 'Not currently impersonating anyone' })
    }

    const db = useDb()
    const adminId = parseInt(payload.impersonatedBy)

    // Get the admin user
    const adminUser = await db.query.users.findFirst({
        where: eq(users.id, adminId),
    })

    if (!adminUser) {
        throw createError({ statusCode: 404, statusMessage: 'Admin user not found' })
    }

    // Try to restore from admin_token cookie first
    const adminToken = getCookie(event, 'admin_token')
    if (adminToken) {
        const adminPayload = await verifyAccessToken(adminToken)
        if (adminPayload && !adminPayload.isImpersonating) {
            deleteCookie(event, 'admin_token')
            return {
                message: 'Impersonation ended, restored to admin session',
                user: {
                    id: adminUser.id,
                    email: adminUser.email,
                    firstName: adminUser.firstName,
                    lastName: adminUser.lastName,
                    role: adminUser.role,
                },
                accessToken: adminToken,
                isImpersonating: false,
            }
        }
    }

    // Generate fresh admin tokens
    const config = useRuntimeConfig()
    const tokenId = generateTokenId()
    const accessToken = await generateAccessToken(adminUser)
    const refreshToken = await generateRefreshToken(adminUser.id, tokenId)

    // Store refresh token
    const refreshExpiration = new Date(Date.now() + parseExpirationToMs(config.jwtRefreshExpiration))
    await db.insert(refreshTokens).values({
        token: tokenId,
        userId: adminUser.id,
        expiresAt: refreshExpiration,
    })

    // Update cookies
    setCookie(event, 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    })

    deleteCookie(event, 'admin_token')

    return {
        message: 'Impersonation ended',
        user: {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            role: adminUser.role,
        },
        accessToken,
        isImpersonating: false,
    }
})

defineRouteMeta({
    openAPI: {
        tags: ['Admin'],
        summary: 'Stop impersonation',
        description: 'End user impersonation and return to admin context',
        security: [{ bearerAuth: [] }],
    },
})
