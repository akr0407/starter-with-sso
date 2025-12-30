// OpenAPI specification for the SaaS Starter API
export default defineEventHandler(() => {
    return {
        openapi: '3.0.0',
        info: {
            title: 'SaaS Starter API',
            version: '1.0.0',
            description: 'API documentation for the SaaS Starter boilerplate',
        },
        servers: [
            { url: '/api/v1', description: 'API v1' },
        ],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Users', description: 'User management' },
            { name: 'Organizations', description: 'Organization management' },
            { name: 'Projects', description: 'Project management' },
            { name: 'Admin', description: 'Admin operations' },
        ],
        paths: {
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Register a new user',
                    requestBody: {
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
                        '201': { description: 'User registered successfully' },
                        '400': { description: 'Validation error' },
                        '409': { description: 'Email already exists' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login user',
                    requestBody: {
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
                        '200': { description: 'Login successful' },
                        '401': { description: 'Invalid credentials' },
                    },
                },
            },
            '/auth/refresh': {
                post: {
                    tags: ['Auth'],
                    summary: 'Refresh access token',
                    responses: {
                        '200': { description: 'Token refreshed' },
                        '401': { description: 'Invalid refresh token' },
                    },
                },
            },
            '/auth/logout': {
                post: {
                    tags: ['Auth'],
                    summary: 'Logout user',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        '200': { description: 'Logged out' },
                    },
                },
            },
            '/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Get current user',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        '200': { description: 'Current user data' },
                        '401': { description: 'Unauthorized' },
                    },
                },
            },
            '/users': {
                get: {
                    tags: ['Users'],
                    summary: 'List all users (admin only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                        { name: 'search', in: 'query', schema: { type: 'string' } },
                    ],
                    responses: {
                        '200': { description: 'List of users' },
                        '403': { description: 'Admin access required' },
                    },
                },
            },
            '/users/{id}': {
                get: {
                    tags: ['Users'],
                    summary: 'Get user by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'User data' } },
                },
                put: {
                    tags: ['Users'],
                    summary: 'Update user',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'User updated' } },
                },
                delete: {
                    tags: ['Users'],
                    summary: 'Delete user (superadmin only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'User deleted' } },
                },
            },
            '/organizations': {
                get: {
                    tags: ['Organizations'],
                    summary: 'List organizations',
                    security: [{ bearerAuth: [] }],
                    responses: { '200': { description: 'List of organizations' } },
                },
                post: {
                    tags: ['Organizations'],
                    summary: 'Create organization',
                    security: [{ bearerAuth: [] }],
                    responses: { '201': { description: 'Organization created' } },
                },
            },
            '/organizations/{id}': {
                get: {
                    tags: ['Organizations'],
                    summary: 'Get organization',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'Organization data' } },
                },
                put: {
                    tags: ['Organizations'],
                    summary: 'Update organization',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'Organization updated' } },
                },
                delete: {
                    tags: ['Organizations'],
                    summary: 'Delete organization',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'Organization deleted' } },
                },
            },
            '/projects': {
                get: {
                    tags: ['Projects'],
                    summary: 'List projects',
                    security: [{ bearerAuth: [] }],
                    responses: { '200': { description: 'List of projects' } },
                },
                post: {
                    tags: ['Projects'],
                    summary: 'Create project',
                    security: [{ bearerAuth: [] }],
                    responses: { '201': { description: 'Project created' } },
                },
            },
            '/projects/{id}': {
                get: {
                    tags: ['Projects'],
                    summary: 'Get project',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'Project data' } },
                },
                put: {
                    tags: ['Projects'],
                    summary: 'Update project',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'Project updated' } },
                },
                delete: {
                    tags: ['Projects'],
                    summary: 'Delete project',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { '200': { description: 'Project deleted' } },
                },
            },
            '/admin/impersonate': {
                post: {
                    tags: ['Admin'],
                    summary: 'Impersonate user (superadmin only)',
                    security: [{ bearerAuth: [] }],
                    responses: { '200': { description: 'Impersonation started' } },
                },
            },
            '/admin/stop-impersonate': {
                post: {
                    tags: ['Admin'],
                    summary: 'Stop impersonation',
                    security: [{ bearerAuth: [] }],
                    responses: { '200': { description: 'Impersonation stopped' } },
                },
            },
            '/admin/audit-logs': {
                get: {
                    tags: ['Admin'],
                    summary: 'Get audit logs (admin only)',
                    security: [{ bearerAuth: [] }],
                    responses: { '200': { description: 'List of audit logs' } },
                },
            },
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    }
})
