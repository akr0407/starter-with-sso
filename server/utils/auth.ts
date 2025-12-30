import * as jose from 'jose'
import { hash, compare } from 'bcrypt'
import type { User } from '../db/schema'

const SALT_ROUNDS = 12

// Password hashing
export async function hashPassword(password: string): Promise<string> {
    return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword)
}

// JWT Token Types
export interface JwtPayload {
    sub: string // User ID
    email: string
    role: string
    iat?: number
    exp?: number
    // Impersonation fields
    impersonatedBy?: string // Original admin user ID
    isImpersonating?: boolean
}

export interface RefreshTokenPayload {
    sub: string
    tokenId: string
    iat?: number
    exp?: number
}

// Token generation
export async function generateAccessToken(
    user: Pick<User, 'id' | 'email' | 'role'>,
    impersonatedBy?: number
): Promise<string> {
    const config = useRuntimeConfig()
    const secret = new TextEncoder().encode(config.jwtSecret)

    const payload: JwtPayload = {
        sub: String(user.id),
        email: user.email,
        role: user.role,
    }

    // Add impersonation info if applicable
    if (impersonatedBy) {
        payload.impersonatedBy = String(impersonatedBy)
        payload.isImpersonating = true
    }

    return new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(config.jwtExpiration)
        .sign(secret)
}

export async function generateRefreshToken(
    userId: number,
    tokenId: string
): Promise<string> {
    const config = useRuntimeConfig()
    const secret = new TextEncoder().encode(config.jwtRefreshSecret)

    const payload: RefreshTokenPayload = {
        sub: String(userId),
        tokenId,
    }

    return new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(config.jwtRefreshExpiration)
        .sign(secret)
}

// Token verification
export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
        const config = useRuntimeConfig()
        const secret = new TextEncoder().encode(config.jwtSecret)

        const { payload } = await jose.jwtVerify(token, secret)
        return payload as unknown as JwtPayload
    } catch {
        return null
    }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
        const config = useRuntimeConfig()
        const secret = new TextEncoder().encode(config.jwtRefreshSecret)

        const { payload } = await jose.jwtVerify(token, secret)
        return payload as unknown as RefreshTokenPayload
    } catch {
        return null
    }
}

// Parse expiration string to milliseconds
export function parseExpirationToMs(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/)
    if (!match) throw new Error(`Invalid expiration format: ${expiration}`)

    const value = parseInt(match[1], 10)
    const unit = match[2]

    const multipliers: Record<string, number> = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
    }

    return value * multipliers[unit]
}

// Generate random token ID
export function generateTokenId(): string {
    return crypto.randomUUID()
}
