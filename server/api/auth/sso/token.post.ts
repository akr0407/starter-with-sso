/**
 * SSO Token Exchange API
 * Handles OIDC token exchange server-side to keep client_secret secure
 * Also creates/finds local user and generates local JWT for API authentication
 */
import { eq } from 'drizzle-orm'
import { users, refreshTokens } from '~/server/db/schema'
import { generateAccessToken, generateRefreshToken, generateTokenId, hashPassword } from '~/server/utils/auth'
import { useDb } from '~/server/utils/db'

interface SSOUserInfo {
    sub: string
    email: string
    name: string
    given_name?: string
    family_name?: string
    employee_id?: string
    department?: string
    position?: string
    avatar_url?: string
    role_id?: string
    role_name?: string
}

interface SSOTokenResponse {
    access_token: string
    refresh_token: string
    id_token: string
    expires_in: number
    token_type: string
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const db = useDb()
    const body = await readBody(event)

    const { code, redirectUri, codeVerifier } = body

    if (!code) {
        throw createError({
            statusCode: 400,
            message: 'Authorization code is required',
        })
    }

    // Build token request body
    const tokenBody: Record<string, string> = {
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || config.public.sso.redirectUri,
        code,
    }

    // Add PKCE verifier if provided
    if (codeVerifier) {
        tokenBody.code_verifier = codeVerifier
    }

    // Build Basic auth header with client credentials
    const clientId = config.public.sso.clientId
    const clientSecret = config.sso.clientSecret
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
        // Step 1: Exchange code for tokens from SSO server
        const ssoTokens = await $fetch<SSOTokenResponse>(`${config.public.sso.baseUrl}/api/oidc/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: new URLSearchParams(tokenBody),
        })

        // Step 2: Fetch user info from SSO server
        const userInfo = await $fetch<SSOUserInfo>(`${config.public.sso.baseUrl}/api/oidc/userinfo`, {
            headers: {
                'Authorization': `Bearer ${ssoTokens.access_token}`,
            },
        })

        // Step 3: Find or create user in local database
        let user = await db.query.users.findFirst({
            where: eq(users.email, userInfo.email),
        })

        if (!user) {
            // Create new user for SSO login
            // Generate a random password since SSO users don't use password login
            const randomPassword = crypto.randomUUID() + crypto.randomUUID()
            const hashedPassword = await hashPassword(randomPassword)

            // Parse name into first/last name
            const nameParts = userInfo.name?.split(' ') || ['User']
            const firstName = userInfo.given_name || nameParts[0] || 'User'
            const lastName = userInfo.family_name || nameParts.slice(1).join(' ') || ''

            const [newUser] = await db.insert(users).values({
                email: userInfo.email,
                password: hashedPassword,
                firstName,
                lastName: lastName || 'SSO',
                role: 'user',
                isActive: true,
                emailVerifiedAt: new Date(), // SSO users are considered verified
            }).returning()

            user = newUser
        }

        // Step 4: Generate local JWT tokens for API authentication
        const accessToken = await generateAccessToken(user)
        const tokenId = generateTokenId()
        const localRefreshToken = await generateRefreshToken(user.id, tokenId)

        // Store refresh token in database
        await db.insert(refreshTokens).values({
            userId: user.id,
            token: localRefreshToken, // Store the actual JWT refresh token
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })

        // Step 5: Return both SSO tokens and local tokens
        return {
            // SSO tokens (for SSO-specific operations like userinfo, logout)
            sso_access_token: ssoTokens.access_token,
            sso_refresh_token: ssoTokens.refresh_token,
            sso_id_token: ssoTokens.id_token,
            sso_expires_in: ssoTokens.expires_in,
            // Local tokens (for API authentication)
            access_token: accessToken,
            refresh_token: localRefreshToken,
            expires_in: 900, // 15 minutes
            // User info
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive,
            },
            // SSO user info
            sso_user: {
                sub: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                employee_id: userInfo.employee_id,
                department: userInfo.department,
                position: userInfo.position,
                avatar_url: userInfo.avatar_url,
                role_id: userInfo.role_id,
                role_name: userInfo.role_name,
            },
        }
    } catch (error: unknown) {
        const err = error as { statusCode?: number; data?: unknown; message?: string }
        console.error('SSO token exchange error:', err)
        throw createError({
            statusCode: err.statusCode || 500,
            message: err.message || 'SSO authentication failed',
            data: err.data,
        })
    }
})
