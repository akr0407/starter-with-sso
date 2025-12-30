/**
 * SSO Authentication utilities for OIDC flow
 */

import type { OIDCTokenResponse, OIDCUserInfo } from '~/types/sso'

/**
 * Build authorization URL for OIDC flow
 */
export function buildAuthUrl(config: {
    baseUrl: string
    clientId: string
    redirectUri: string
    scopes: string[]
    state: string
    nonce: string
    codeChallenge?: string
}): string {
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state: config.state,
        nonce: config.nonce,
    })

    // Add PKCE challenge if provided
    if (config.codeChallenge) {
        params.append('code_challenge', config.codeChallenge)
        params.append('code_challenge_method', 'S256')
    }

    return `${config.baseUrl}/api/oidc/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(config: {
    baseUrl: string
    clientId: string
    clientSecret?: string
    redirectUri: string
    code: string
    codeVerifier?: string
}): Promise<OIDCTokenResponse> {
    const body: Record<string, string> = {
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
        code: config.code,
    }

    // Add PKCE verifier if available
    if (config.codeVerifier) {
        body.code_verifier = config.codeVerifier
    }

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    // Use Basic auth for client credentials (Client Secret Basic method)
    if (config.clientSecret) {
        const credentials = btoa(`${config.clientId}:${config.clientSecret}`)
        headers['Authorization'] = `Basic ${credentials}`
    } else {
        // Fallback: include client_id in body if no secret
        body.client_id = config.clientId
    }

    const response = await $fetch<OIDCTokenResponse>(`${config.baseUrl}/api/oidc/token`, {
        method: 'POST',
        headers,
        body: new URLSearchParams(body),
    })

    return response
}

/**
 * Fetch user info from SSO
 */
export async function fetchUserInfo(baseUrl: string, accessToken: string): Promise<OIDCUserInfo> {
    return await $fetch<OIDCUserInfo>(`${baseUrl}/api/oidc/userinfo`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}

/**
 * Refresh access token
 */
export async function refreshSSOToken(config: {
    baseUrl: string
    clientId: string
    clientSecret?: string
    refreshToken: string
}): Promise<OIDCTokenResponse> {
    const body: Record<string, string> = {
        grant_type: 'refresh_token',
        client_id: config.clientId,
        refresh_token: config.refreshToken,
    }

    if (config.clientSecret) {
        body.client_secret = config.clientSecret
    }

    const response = await $fetch<OIDCTokenResponse>(`${config.baseUrl}/api/oidc/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body),
    })

    return response
}

/**
 * Build logout URL for SSO
 */
export function buildLogoutUrl(config: {
    baseUrl: string
    idToken: string
    postLogoutRedirectUri: string
}): string {
    const params = new URLSearchParams({
        id_token_hint: config.idToken,
        post_logout_redirect_uri: config.postLogoutRedirectUri,
    })

    return `${config.baseUrl}/api/oidc/logout?${params.toString()}`
}
