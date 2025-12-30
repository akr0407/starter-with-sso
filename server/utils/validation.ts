import { z } from 'zod'
import { H3Event, createError } from 'h3'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
})

export const createOrganizationSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    description: z.string().max(1000).optional(),
})

export const updateOrganizationSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
})

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
    organizationId: z.number().int().positive('Organization ID is required'),
})

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['active', 'archived', 'completed']).optional(),
})

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const impersonateSchema = z.object({
    userId: z.number().int().positive('User ID is required'),
})

// Validation helper
export async function validateBody<T>(event: H3Event, schema: z.ZodSchema<T>): Promise<T> {
    const body = await readBody(event)
    const result = schema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation Error',
            data: {
                errors: result.error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            },
        })
    }

    return result.data
}

export function validateQuery<T>(event: H3Event, schema: z.ZodSchema<T>): T {
    const query = getQuery(event)
    const result = schema.safeParse(query)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation Error',
            data: {
                errors: result.error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            },
        })
    }

    return result.data
}

export function validateParams<T>(event: H3Event, schema: z.ZodSchema<T>): T {
    const params = getRouterParams(event)
    const result = schema.safeParse(params)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation Error',
            data: {
                errors: result.error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            },
        })
    }

    return result.data
}
