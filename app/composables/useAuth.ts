// User preferences type
interface UserPreferences {
    theme?: {
        primaryColor?: string
        mode?: 'dark' | 'light'
    }
}
interface User {
    id: number
    email: string
    firstName: string
    lastName: string
    role: 'user' | 'admin' | 'superadmin'
    isActive?: boolean
    preferences?: UserPreferences
}

interface AuthState {
    user: User | null
    accessToken: string | null
    isImpersonating: boolean
    impersonatedBy: number | null
}

const authState = reactive<AuthState>({
    user: null,
    accessToken: null,
    isImpersonating: false,
    impersonatedBy: null,
})

export function useAuth() {
    const config = useRuntimeConfig()
    const router = useRouter()

    const isAuthenticated = computed(() => !!authState.accessToken && !!authState.user)
    const isAdmin = computed(() => ['admin', 'superadmin'].includes(authState.user?.role ?? ''))
    const isSuperadmin = computed(() => authState.user?.role === 'superadmin')

    // Load token from storage on client
    async function initialize() {
        if (import.meta.server) return

        const storedToken = localStorage.getItem('accessToken')
        if (storedToken) {
            authState.accessToken = storedToken
            await fetchCurrentUser()
        }
    }

    async function login(email: string, password: string) {
        const response = await $fetch<{
            user: User
            accessToken: string
        }>(`${config.public.apiBase}/auth/login`, {
            method: 'POST',
            body: { email, password },
        })

        authState.user = response.user
        authState.accessToken = response.accessToken
        localStorage.setItem('accessToken', response.accessToken)

        return response
    }

    async function register(data: { email: string; password: string; firstName: string; lastName: string }) {
        const response = await $fetch<{
            user: User
            accessToken: string
        }>(`${config.public.apiBase}/auth/register`, {
            method: 'POST',
            body: data,
        })

        authState.user = response.user
        authState.accessToken = response.accessToken
        localStorage.setItem('accessToken', response.accessToken)

        return response
    }

    async function logout() {
        try {
            await $fetch(`${config.public.apiBase}/auth/logout`, {
                method: 'POST',
            })
        } catch {
            // Ignore errors on logout
        }

        authState.user = null
        authState.accessToken = null
        authState.isImpersonating = false
        authState.impersonatedBy = null
        localStorage.removeItem('accessToken')

        router.push('/login')
    }

    async function fetchCurrentUser() {
        if (!authState.accessToken) return null

        try {
            const response = await $fetch<{
                user: User
                isImpersonating: boolean
                impersonatedBy: number | null
            }>(`${config.public.apiBase}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${authState.accessToken}`,
                },
            })

            authState.user = response.user
            authState.isImpersonating = response.isImpersonating
            authState.impersonatedBy = response.impersonatedBy

            return response.user
        } catch {
            // Token invalid, clear auth
            authState.user = null
            authState.accessToken = null
            localStorage.removeItem('accessToken')
            return null
        }
    }

    async function refreshToken() {
        try {
            const response = await $fetch<{ accessToken: string }>(
                `${config.public.apiBase}/auth/refresh`,
                { method: 'POST' }
            )

            authState.accessToken = response.accessToken
            localStorage.setItem('accessToken', response.accessToken)

            return response.accessToken
        } catch {
            await logout()
            return null
        }
    }

    async function impersonateUser(userId: number) {
        const response = await $fetch<{
            user: User
            accessToken: string
            isImpersonating: boolean
            impersonatedBy: number
        }>(`${config.public.apiBase}/admin/impersonate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authState.accessToken}` },
            body: { userId },
        })

        authState.user = response.user
        authState.accessToken = response.accessToken
        authState.isImpersonating = response.isImpersonating
        authState.impersonatedBy = response.impersonatedBy
        localStorage.setItem('accessToken', response.accessToken)

        return response
    }

    async function stopImpersonation() {
        const response = await $fetch<{
            user: User
            accessToken: string
            isImpersonating: boolean
        }>(`${config.public.apiBase}/admin/stop-impersonate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authState.accessToken}` },
        })

        authState.user = response.user
        authState.accessToken = response.accessToken
        authState.isImpersonating = response.isImpersonating
        authState.impersonatedBy = null
        localStorage.setItem('accessToken', response.accessToken)

        return response
    }

    async function updatePreferences(preferences: Partial<UserPreferences>) {
        if (!authState.accessToken) throw new Error('Not authenticated')

        const response = await $fetch<{
            preferences: UserPreferences
        }>(`${config.public.apiBase}/users/preferences`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${authState.accessToken}` },
            body: { preferences },
        })

        // Update local state
        if (authState.user) {
            authState.user.preferences = response.preferences
        }

        return response.preferences
    }

    return {
        user: computed(() => authState.user),
        accessToken: computed(() => authState.accessToken),
        userPreferences: computed(() => authState.user?.preferences || {}),
        isAuthenticated,
        isAdmin,
        isSuperadmin,
        isImpersonating: computed(() => authState.isImpersonating),
        impersonatedBy: computed(() => authState.impersonatedBy),
        initialize,
        login,
        register,
        logout,
        fetchCurrentUser,
        refreshToken,
        impersonateUser,
        stopImpersonation,
        updatePreferences,
    }
}
