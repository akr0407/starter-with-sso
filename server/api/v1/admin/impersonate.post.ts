import { eq } from 'drizzle-orm'
import { users, refreshTokens } from '~/server/db/schema'
import { verifyAccessToken, generateAccessToken, generateRefreshToken, generateTokenId, parseExpirationToMs } from '~/server/utils/auth'
import { validateBody, impersonateSchema } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const payload = await verifyAccessToken(authHeader.substring(7))
    if (!payload || payload.role !== 'superadmin') {
        throw createError({ statusCode: 403, statusMessage: 'Only superadmin can impersonate users' })
    }

    // Cannot impersonate while already impersonating
    if (payload.isImpersonating) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot impersonate while already impersonating. Stop current impersonation first.' })
    }

    const body = await validateBody(event, impersonateSchema)
    const db = useDb()
    const adminId = parseInt(payload.sub)

    // Cannot impersonate self
    if (body.userId === adminId) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot impersonate yourself' })
    }

    // Get target user
    const targetUser = await db.query.users.findFirst({
        where: eq(users.id, body.userId),
    })

    if (!targetUser) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    if (!targetUser.isActive) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot impersonate inactive user' })
    }

    // Generate impersonation tokens
    const config = useRuntimeConfig()
    const tokenId = generateTokenId()
    const accessToken = await generateAccessToken(targetUser, adminId)
    const refreshToken = await generateRefreshToken(targetUser.id, tokenId)

    // Store refresh token
    const refreshExpiration = new Date(Date.now() + parseExpirationToMs(config.jwtRefreshExpiration))
    await db.insert(refreshTokens).values({
        token: tokenId,
        userId: targetUser.id,
        expiresAt: refreshExpiration,
    })

    // Set new cookies
    setCookie(event, 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    })

    // Store admin token in separate cookie for restoration
    setCookie(event, 'admin_token', authHeader.substring(7), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    })

    return {
        message: `Now impersonating ${targetUser.firstName} ${targetUser.lastName}`,
        user: {
            id: targetUser.id,
            email: targetUser.email,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            role: targetUser.role,
        },
        accessToken,
        isImpersonating: true,
        impersonatedBy: adminId,
    }
})

defineRouteMeta({
    openAPI: {
        tags: ['Admin'],
        summary: 'Impersonate user',
        description: 'Start impersonating another user (superadmin only)',
        security: [{ bearerAuth: [] }],
    },
})
