import { generatePKCE, generateUrlSafeString } from '~/utils/pkce'
import { buildAuthUrl, exchangeCodeForTokens, fetchUserInfo, refreshSSOToken, buildLogoutUrl } from '~/utils/sso-auth'

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

// SSO User type (from SSO provider)
interface SSOUser {
    id: string
    email: string
    name: string
    employeeId?: string
    department?: string
    position?: string
    avatarUrl?: string
    roleId?: string
    roleName?: string
}

interface AuthState {
    user: User | null
    accessToken: string | null
    isImpersonating: boolean
    impersonatedBy: number | null
    // SSO specific
    ssoUser: SSOUser | null
    ssoTokens: {
        accessToken: string
        refreshToken: string
        idToken: string
        expiresAt: number
    } | null
    isSSOAuth: boolean
}

const authState = reactive<AuthState>({
    user: null,
    accessToken: null,
    isImpersonating: false,
    impersonatedBy: null,
    ssoUser: null,
    ssoTokens: null,
    isSSOAuth: false,
})

export function useAuth() {
    const config = useRuntimeConfig()
    const router = useRouter()

    const isAuthenticated = computed(() => {
        // Check both local and SSO authentication
        if (authState.isSSOAuth) {
            return !!authState.ssoTokens && !!authState.ssoUser
        }
        return !!authState.accessToken && !!authState.user
    })
    const isAdmin = computed(() => ['admin', 'superadmin'].includes(authState.user?.role ?? ''))
    const isSuperadmin = computed(() => authState.user?.role === 'superadmin')

    // Load token from storage on client
    async function initialize() {
        if (import.meta.server) return

        // Check for SSO auth first
        const ssoUserStr = localStorage.getItem('sso_user')
        const ssoTokensStr = localStorage.getItem('sso_tokens')

        if (ssoUserStr && ssoTokensStr) {
            try {
                authState.ssoUser = JSON.parse(ssoUserStr)
                authState.ssoTokens = JSON.parse(ssoTokensStr)
                authState.isSSOAuth = true

                // Check if SSO token is expired
                if (authState.ssoTokens && Date.now() >= authState.ssoTokens.expiresAt) {
                    // Token expired, try to refresh or logout
                    try {
                        await refreshSSOTokens()
                    } catch {
                        clearSSOAuth()
                    }
                }
                return
            } catch {
                clearSSOAuth()
            }
        }

        // Fall back to local auth
        const storedToken = localStorage.getItem('accessToken')
        if (storedToken) {
            authState.accessToken = storedToken
            await fetchCurrentUser()
        }
    }

    // =============== SSO Authentication Methods ===============

    /**
     * Initiate SSO login - redirects to SSO provider
     */
    async function ssoLogin(returnUrl?: string) {
        if (import.meta.server) return

        // Generate state and nonce (alphanumeric only to avoid URL encoding issues)
        const state = generateUrlSafeString(32)
        const nonce = generateUrlSafeString(32)

        // Store state in sessionStorage
        sessionStorage.setItem('oauth_state', state)
        sessionStorage.setItem('oauth_nonce', nonce)
        if (returnUrl) {
            sessionStorage.setItem('return_url', returnUrl)
        }

        // Build authorization URL (without PKCE - SSO server doesn't support it)
        const authUrl = buildAuthUrl({
            baseUrl: config.public.sso.baseUrl,
            clientId: config.public.sso.clientId,
            redirectUri: config.public.sso.redirectUri,
            scopes: config.public.sso.scopes,
            state,
            nonce,
            // codeChallenge: disabled - SSO server doesn't have PKCE enabled
        })

        // Redirect to SSO
        window.location.href = authUrl
    }

    /**
     * Handle SSO callback after user authenticates
     */
    async function handleSSOCallback(code: string, state: string) {
        if (import.meta.server) return

        // Verify state (decode to handle URL encoding)
        const savedState = sessionStorage.getItem('oauth_state')
        const decodedState = decodeURIComponent(state)
        if (decodedState !== savedState) {
            console.error('State mismatch:', { received: decodedState, expected: savedState })
            throw new Error('Invalid state parameter')
        }

        try {
            // Exchange code for tokens via server-side API
            // Server now handles: SSO token exchange, user creation/lookup, local JWT generation
            const response = await $fetch<{
                // Local tokens for API authentication
                access_token: string
                refresh_token: string
                expires_in: number
                // SSO tokens for SSO operations (logout, etc.)
                sso_access_token: string
                sso_refresh_token: string
                sso_id_token: string
                sso_expires_in: number
                // User data
                user: User
                sso_user: {
                    sub: string
                    email: string
                    name: string
                    employee_id?: string
                    department?: string
                    position?: string
                    avatar_url?: string
                    role_id?: string
                    role_name?: string
                }
            }>('/api/auth/sso/token', {
                method: 'POST',
                body: {
                    code,
                    redirectUri: config.public.sso.redirectUri,
                },
            })

            console.log('SSO login successful, user:', response.user.email)

            // Prepare SSO user data
            const ssoUser: SSOUser = {
                id: response.sso_user.sub,
                email: response.sso_user.email,
                name: response.sso_user.name,
                employeeId: response.sso_user.employee_id,
                department: response.sso_user.department,
                position: response.sso_user.position,
                avatarUrl: response.sso_user.avatar_url,
                roleId: response.sso_user.role_id,
                roleName: response.sso_user.role_name,
            }

            const ssoTokens = {
                accessToken: response.sso_access_token,
                refreshToken: response.sso_refresh_token,
                idToken: response.sso_id_token,
                expiresAt: Date.now() + response.sso_expires_in * 1000,
            }

            // Save SSO state
            authState.ssoUser = ssoUser
            authState.ssoTokens = ssoTokens
            authState.isSSOAuth = true

            // Save local auth state (for API calls)
            authState.user = response.user
            authState.accessToken = response.access_token

            // Persist to localStorage
            localStorage.setItem('sso_user', JSON.stringify(ssoUser))
            localStorage.setItem('sso_tokens', JSON.stringify(ssoTokens))
            localStorage.setItem('accessToken', response.access_token)
            localStorage.setItem('refreshToken', response.refresh_token)
            console.log('Auth data persisted to localStorage')

            // Clean up session storage
            sessionStorage.removeItem('oauth_state')
            sessionStorage.removeItem('oauth_nonce')

            // Redirect to return URL or dashboard
            const returnUrl = sessionStorage.getItem('return_url') || '/dashboard'
            sessionStorage.removeItem('return_url')
            console.log('Redirecting to:', returnUrl)

            await router.push(returnUrl)
        } catch (error) {
            console.error('OAuth callback error:', error)
            throw error
        }
    }

    /**
     * SSO logout
     */
    async function ssoLogout() {
        const idToken = authState.ssoTokens?.idToken

        // Clear local SSO auth
        clearSSOAuth()

        // Redirect to SSO logout if we have id_token
        if (idToken && import.meta.client) {
            const logoutUrl = buildLogoutUrl({
                baseUrl: config.public.sso.baseUrl,
                idToken,
                postLogoutRedirectUri: window.location.origin,
            })
            window.location.href = logoutUrl
        } else {
            await router.push('/login')
        }
    }

    /**
     * Refresh SSO tokens
     */
    async function refreshSSOTokens() {
        if (!authState.ssoTokens?.refreshToken) {
            throw new Error('No refresh token available')
        }

        try {
            const tokenResponse = await refreshSSOToken({
                baseUrl: config.public.sso.baseUrl,
                clientId: config.public.sso.clientId,
                refreshToken: authState.ssoTokens.refreshToken,
            })

            const ssoTokens = {
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token || authState.ssoTokens.refreshToken,
                idToken: tokenResponse.id_token || authState.ssoTokens.idToken,
                expiresAt: Date.now() + tokenResponse.expires_in * 1000,
            }

            authState.ssoTokens = ssoTokens
            localStorage.setItem('sso_tokens', JSON.stringify(ssoTokens))
        } catch (error) {
            console.error('SSO token refresh failed:', error)
            await ssoLogout()
            throw error
        }
    }

    /**
     * Clear SSO authentication state
     */
    function clearSSOAuth() {
        authState.ssoUser = null
        authState.ssoTokens = null
        authState.isSSOAuth = false
        localStorage.removeItem('sso_user')
        localStorage.removeItem('sso_tokens')
    }

    /**
     * Ensure SSO token is valid (auto-refresh if needed)
     */
    async function ensureValidSSOToken() {
        if (!authState.ssoTokens) return

        // Refresh 5 minutes before expiry
        if (Date.now() >= authState.ssoTokens.expiresAt - 5 * 60 * 1000) {
            await refreshSSOTokens()
        }
    }

    // =============== Local Authentication Methods ===============

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
        authState.isSSOAuth = false
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
        authState.isSSOAuth = false
        localStorage.setItem('accessToken', response.accessToken)

        return response
    }

    async function logout() {
        // If SSO auth, use SSO logout
        if (authState.isSSOAuth) {
            await ssoLogout()
            return
        }

        // Local auth logout
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
        // State
        user: computed(() => authState.user),
        ssoUser: computed(() => authState.ssoUser),
        accessToken: computed(() => authState.accessToken), // Always use local JWT (SSO users also get local JWT)
        userPreferences: computed(() => authState.user?.preferences || {}),
        isAuthenticated,
        isAdmin,
        isSuperadmin,
        isImpersonating: computed(() => authState.isImpersonating),
        impersonatedBy: computed(() => authState.impersonatedBy),
        isSSOAuth: computed(() => authState.isSSOAuth),

        // Init
        initialize,

        // SSO methods
        ssoLogin,
        handleSSOCallback,
        ssoLogout,
        refreshSSOTokens,
        ensureValidSSOToken,

        // Local auth methods
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

