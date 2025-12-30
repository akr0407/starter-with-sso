/**
 * SSO Token Exchange API
 * Handles OIDC token exchange server-side to keep client_secret secure
 */
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
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
        // Exchange code for tokens
        const response = await $fetch(`${config.public.sso.baseUrl}/api/oidc/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: new URLSearchParams(tokenBody),
        })

        return response
    } catch (error: unknown) {
        const err = error as { statusCode?: number; data?: unknown; message?: string }
        console.error('Token exchange error:', err)
        throw createError({
            statusCode: err.statusCode || 500,
            message: err.message || 'Token exchange failed',
            data: err.data,
        })
    }
})
