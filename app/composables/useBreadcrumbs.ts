export const useBreadcrumbs = () => {
    const route = useRoute()
    const router = useRouter()

    const breadcrumbs = computed(() => {
        const path = route.path || ''
        if (path === '/' || path === '/dashboard') {
            return [{ label: 'Dashboard', to: '/dashboard' }]
        }

        const segments = path.split('/').filter(Boolean)
        const crumbs = []

        // Always start with Dashboard if not login/register
        if (!['login', 'register'].includes(segments[0])) {
            crumbs.push({ label: 'Dashboard', to: '/dashboard' })
        }

        let currentPath = ''

        segments.forEach((segment, index) => {
            currentPath += `/${segment}`

            // Skip 'dashboard' if it's already added or processed
            if (segment === 'dashboard') return

            // Format label: capitalize and remove dashes
            let label = segment.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')

            // If it's the last segment and corresponds to an ID (looks like a number or UUID), try to use a more specific label
            // In a real app, you might look up the name from a store or API
            // For now, if it's numeric, we call it "Details"
            if (!isNaN(Number(segment))) {
                label = 'Details'
            }

            crumbs.push({
                label,
                to: currentPath
            })
        })

        return crumbs
    })

    return {
        breadcrumbs
    }
}
