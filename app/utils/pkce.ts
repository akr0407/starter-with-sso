/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 */

import type { PKCEPair } from '~/types/sso'

/**
 * Generate a cryptographically random string (for PKCE)
 */
export function generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const values = new Uint8Array(length)
    crypto.getRandomValues(values)

    return Array.from(values)
        .map(v => charset[v % charset.length])
        .join('')
}

/**
 * Generate a URL-safe random string (alphanumeric only, for OAuth state/nonce)
 */
export function generateUrlSafeString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const values = new Uint8Array(length)
    crypto.getRandomValues(values)

    return Array.from(values)
        .map(v => charset[v % charset.length])
        .join('')
}

/**
 * Check if crypto.subtle is available (requires HTTPS or localhost)
 */
export function isCryptoSubtleAvailable(): boolean {
    return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

/**
 * Compute SHA-256 hash of a string
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return await crypto.subtle.digest('SHA-256', data)
}

/**
 * Base64 URL encode an ArrayBuffer
 */
function base64UrlEncode(arrayBuffer: ArrayBuffer): string {
    const bytes = new Uint8Array(arrayBuffer)
    const binary = Array.from(bytes)
        .map(byte => String.fromCharCode(byte))
        .join('')
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

/**
 * Generate PKCE code verifier and challenge
 * @returns Object containing code_verifier and code_challenge, or null if crypto.subtle unavailable
 */
export async function generatePKCE(): Promise<PKCEPair | null> {
    // Check if crypto.subtle is available (requires HTTPS or localhost)
    if (!isCryptoSubtleAvailable()) {
        console.warn('PKCE not available: crypto.subtle requires HTTPS or localhost')
        return null
    }

    // Generate random code verifier (43-128 characters recommended)
    const codeVerifier = generateRandomString(128)

    // Generate code challenge (SHA-256 hash of verifier, base64url encoded)
    const hash = await sha256(codeVerifier)
    const codeChallenge = base64UrlEncode(hash)

    return {
        codeVerifier,
        codeChallenge,
    }
}
