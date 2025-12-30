export default defineNuxtRouteMiddleware(async (to) => {
    // Only run on client side
    if (import.meta.server) return

    const { isAuthenticated, initialize } = useAuth()

    // Initialize auth state
    await initialize()

    // Protected routes
    const protectedPaths = ['/dashboard', '/admin']
    const isProtected = protectedPaths.some(path => to.path.startsWith(path))

    if (isProtected && !isAuthenticated.value) {
        return navigateTo('/login')
    }

    // Redirect to dashboard if already logged in
    if ((to.path === '/login' || to.path === '/register') && isAuthenticated.value) {
        return navigateTo('/dashboard')
    }
})
