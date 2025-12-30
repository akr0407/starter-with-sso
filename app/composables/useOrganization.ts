
export const useOrganization = () => {
    const api = useApi()
    const { user } = useAuth()

    // Global state for user's organizations
    const userOrgs = useState<any[]>('userOrgs', () => [])
    const currentOrg = useState<any>('currentOrg', () => null)
    const loading = useState<boolean>('orgLoading', () => false)

    async function fetchUserOrgs() {
        if (!user.value) return

        loading.value = true
        try {
            const res = await api.get<{ data: any[] }>('/organizations', { limit: 100 })
            userOrgs.value = res.data

            // Set default if none selected
            if (!currentOrg.value && res.data.length > 0) {
                // Try to restore from cookie/storage if possible, otherwise first
                currentOrg.value = res.data[0]
            }

            // Verify current org is still accessible
            if (currentOrg.value && !res.data.find(o => o.id === currentOrg.value.id)) {
                currentOrg.value = res.data[0] || null
            }
        } catch (e) {
            console.error('Failed to fetch orgs', e)
        } finally {
            loading.value = false
        }
    }

    function setCurrentOrg(org: any) {
        currentOrg.value = org
    }

    return {
        userOrgs,
        currentOrg,
        loading,
        fetchUserOrgs,
        setCurrentOrg
    }
}
