export default defineNuxtRouteMiddleware(async (to) => {
    // Only run on client side
    if (import.meta.server) return

    const { isAuthenticated, initialize, ensureValidSSOToken, isSSOAuth } = useAuth()

    // Initialize auth state
    await initialize()

    // Protected routes
    const protectedPaths = ['/dashboard', '/admin']
    const publicPaths = ['/login', '/register', '/auth/callback', '/']
    const isProtected = protectedPaths.some(path => to.path.startsWith(path))
    const isPublic = publicPaths.some(path => to.path === path || to.path.startsWith('/auth/'))

    if (isProtected && !isAuthenticated.value) {
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    // Ensure SSO token is valid if authenticated via SSO
    if (isProtected && isAuthenticated.value && isSSOAuth.value) {
        try {
            await ensureValidSSOToken()
        } catch {
            return navigateTo('/login')
        }
    }

    // Redirect to dashboard if already logged in
    if ((to.path === '/login' || to.path === '/register') && isAuthenticated.value) {
        return navigateTo('/dashboard')
    }
})

