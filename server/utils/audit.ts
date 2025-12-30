import type { H3Event } from 'h3'
import { auditLogs, type NewAuditLog } from '../db/schema'

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'VIEW'

interface AuditContext {
    userId?: number
    impersonatedBy?: number
    ipAddress?: string
    userAgent?: string
}

// Create an audit log entry
export async function createAuditLog(
    tableName: string,
    action: AuditAction,
    recordId: number,
    context: AuditContext,
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>
): Promise<void> {
    const db = useDb()

    const logEntry: NewAuditLog = {
        tableName,
        action,
        recordId,
        oldData: oldData ?? null,
        newData: newData ?? null,
        userId: context.userId ?? null,
        impersonatedBy: context.impersonatedBy ?? null,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
    }

    await db.insert(auditLogs).values(logEntry)
}

// Extract audit context from H3 event
export function getAuditContext(event: H3Event): AuditContext {
    const user = event.context.user

    return {
        userId: user?.id,
        impersonatedBy: user?.impersonatedBy,
        ipAddress: getClientIp(event),
        userAgent: getHeader(event, 'user-agent') ?? undefined,
    }
}

// Get client IP address
function getClientIp(event: H3Event): string | undefined {
    // Check common proxy headers
    const xForwardedFor = getHeader(event, 'x-forwarded-for')
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim()
    }

    const xRealIp = getHeader(event, 'x-real-ip')
    if (xRealIp) {
        return xRealIp
    }

    // Fallback to remote address
    return undefined
}

// Helper to create audit log for INSERT
export async function auditInsert(
    event: H3Event,
    tableName: string,
    recordId: number,
    newData: Record<string, unknown>
): Promise<void> {
    await createAuditLog(tableName, 'INSERT', recordId, getAuditContext(event), undefined, newData)
}

// Helper to create audit log for UPDATE
export async function auditUpdate(
    event: H3Event,
    tableName: string,
    recordId: number,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>
): Promise<void> {
    await createAuditLog(tableName, 'UPDATE', recordId, getAuditContext(event), oldData, newData)
}

// Helper to create audit log for DELETE
export async function auditDelete(
    event: H3Event,
    tableName: string,
    recordId: number,
    oldData: Record<string, unknown>
): Promise<void> {
    await createAuditLog(tableName, 'DELETE', recordId, getAuditContext(event), oldData, undefined)
}

// Helper to create audit log for VIEW (GET requests)
export async function auditView(
    event: H3Event,
    tableName: string,
    recordId: number
): Promise<void> {
    await createAuditLog(tableName, 'VIEW', recordId, getAuditContext(event), undefined, undefined)
}

