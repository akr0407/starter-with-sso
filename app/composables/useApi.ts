type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface ApiOptions {
    method?: HttpMethod
    body?: Record<string, unknown>
    params?: Record<string, string | number>
}

export function useApi() {
    const config = useRuntimeConfig()
    const { accessToken, refreshToken, logout } = useAuth()

    async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { method = 'GET', body, params } = options

        // Build URL with params - filter out undefined/null values
        let url = `${config.public.apiBase}${endpoint}`
        if (params) {
            const searchParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value))
                }
            })
            const queryString = searchParams.toString()
            if (queryString) {
                url += `?${queryString}`
            }
        }

        const headers: Record<string, string> = {}
        if (accessToken.value) {
            headers.Authorization = `Bearer ${accessToken.value}`
        }

        try {
            return await $fetch<T>(url, {
                method,
                body,
                headers,
            })
        } catch (error: unknown) {
            // Handle 401 - try to refresh token
            const fetchError = error as { status?: number }
            if (fetchError.status === 401 && accessToken.value) {
                const newToken = await refreshToken()
                if (newToken) {
                    headers.Authorization = `Bearer ${newToken}`
                    return await $fetch<T>(url, { method, body, headers })
                }
            }
            throw error
        }
    }

    return {
        get: <T>(endpoint: string, params?: Record<string, string | number>) =>
            api<T>(endpoint, { method: 'GET', params }),
        post: <T>(endpoint: string, body?: Record<string, unknown>) =>
            api<T>(endpoint, { method: 'POST', body }),
        put: <T>(endpoint: string, body?: Record<string, unknown>) =>
            api<T>(endpoint, { method: 'PUT', body }),
        delete: <T>(endpoint: string) =>
            api<T>(endpoint, { method: 'DELETE' }),
    }
}
