import { eq } from 'drizzle-orm'
import { users, refreshTokens } from '~/server/db/schema'
import {
    verifyPassword,
    generateAccessToken,
    generateRefreshToken,
    generateTokenId,
    parseExpirationToMs
} from '~/server/utils/auth'
import { validateBody, loginSchema } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
    // Validate request body
    const body = await validateBody(event, loginSchema)

    const db = useDb()

    // Find user by email
    const user = await db.query.users.findFirst({
        where: eq(users.email, body.email.toLowerCase()),
    })

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials',
            message: 'Invalid email or password',
        })
    }

    // Check if user is active
    if (!user.isActive) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Account disabled',
            message: 'Your account has been disabled. Please contact support.',
        })
    }

    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.password)
    if (!isValidPassword) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials',
            message: 'Invalid email or password',
        })
    }

    // Generate tokens
    const config = useRuntimeConfig()
    const tokenId = generateTokenId()
    const accessToken = await generateAccessToken(user)
    const refreshToken = await generateRefreshToken(user.id, tokenId)

    // Store refresh token
    const refreshExpiration = new Date(Date.now() + parseExpirationToMs(config.jwtRefreshExpiration))
    await db.insert(refreshTokens).values({
        token: tokenId,
        userId: user.id,
        expiresAt: refreshExpiration,
    })

    // Set refresh token as HTTP-only cookie
    setCookie(event, 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    })

    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        },
        accessToken,
    }
})

// OpenAPI metadata
defineRouteMeta({
    openAPI: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate with email and password to receive access tokens',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['email', 'password'],
                        properties: {
                            email: { type: 'string', format: 'email' },
                            password: { type: 'string' },
                        },
                    },
                },
            },
        },
        responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
            403: { description: 'Account disabled' },
        },
    },
})
