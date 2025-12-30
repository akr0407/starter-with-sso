import { eq } from 'drizzle-orm'
import { users, refreshTokens } from '~/server/db/schema'
import {
    hashPassword,
    generateAccessToken,
    generateRefreshToken,
    generateTokenId,
    parseExpirationToMs
} from '~/server/utils/auth'
import { validateBody, registerSchema } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
    // Validate request body
    const body = await validateBody(event, registerSchema)

    const db = useDb()

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, body.email.toLowerCase()),
    })

    if (existingUser) {
        throw createError({
            statusCode: 409,
            statusMessage: 'User already exists',
            message: 'An account with this email already exists',
        })
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password)

    // Create user
    const [newUser] = await db.insert(users).values({
        email: body.email.toLowerCase(),
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        role: 'user',
    }).returning()

    // Generate tokens
    const config = useRuntimeConfig()
    const tokenId = generateTokenId()
    const accessToken = await generateAccessToken(newUser)
    const refreshToken = await generateRefreshToken(newUser.id, tokenId)

    // Store refresh token
    const refreshExpiration = new Date(Date.now() + parseExpirationToMs(config.jwtRefreshExpiration))
    await db.insert(refreshTokens).values({
        token: tokenId,
        userId: newUser.id,
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
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
        },
        accessToken,
    }
})

// OpenAPI metadata
defineRouteMeta({
    openAPI: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Create a new user account and receive authentication tokens',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['email', 'password', 'firstName', 'lastName'],
                        properties: {
                            email: { type: 'string', format: 'email' },
                            password: { type: 'string', minLength: 8 },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                        },
                    },
                },
            },
        },
        responses: {
            200: { description: 'User registered successfully' },
            400: { description: 'Validation error' },
            409: { description: 'User already exists' },
        },
    },
})
