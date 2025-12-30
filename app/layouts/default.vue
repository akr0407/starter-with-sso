```html
<script setup lang="ts">
import { NLayout, NLayoutHeader, NLayoutSider, NLayoutContent, NMenu, NButton, NIcon, NAvatar, NDropdown, NBreadcrumb, NBreadcrumbItem, NBackTop, useMessage } from 'naive-ui'
import { LayoutGrid, PanelLeft, Search, Plus, ChevronsUpDown } from 'lucide-vue-next'
import { mainNavItems, adminNavItems, bottomNavItems, userMenuOptions } from '~/utils/navigation'

const { user, isAdmin, isSuperadmin, isImpersonating, logout, stopImpersonation } = useAuth()
const router = useRouter()
const route = useRoute()
const { breadcrumbs } = useBreadcrumbs()
const collapsed = ref(false)
const showSearch = ref(false)
const api = useApi()
const message = useMessage()

// Organization Switcher State (Global)
const { userOrgs, currentOrg, fetchUserOrgs, setCurrentOrg } = useOrganization()

// Computed dropdown options
const orgOptions = computed(() => {
    const options: any[] = []
    
    // Header
    options.push({ 
        key: 'header', 
        type: 'render', 
        render: () => h('div', { style: 'padding: 8px 12px; font-size: 12px; color: var(--text-muted); font-weight: 500;' }, 'Organizations') 
    })

    // Orgs
    userOrgs.value.forEach(org => {
        options.push({
            label: org.name,
            key: org.id,
            icon: () => h(NAvatar, { size: 'small', style: 'background-color: var(--primary-color)' }, { default: () => org.name.charAt(0) })
        })
    })

    // Actions
    options.push({ type: 'divider', key: 'd1' })
    options.push({ 
        label: 'Create Organization', 
        key: 'create_new', 
        icon: renderIcon(Plus) 
    })

    return options
})

function handleOrgSelect(key: string | number) {
    if (key === 'create_new') {
        // Trigger create modal (we might need a global bus or just link to empty dashboard? For now, we mimic behavior)
        router.push('/dashboard/organizations')
        message.info('Create a new organization from the dashboard.')
    } else {
        const org = userOrgs.value.find(o => o.id === key)
        if (org) {
            setCurrentOrg(org)
            // Navigate to org details? Or just switch context?
            // User requested "select org from header... project showing make sure only project from current selected org"
            // If we stay on projects page, it should filter. 
            // If we force navigate to /organizations/id, we leave projects page.
            
            // Let's check current route. If we are on /projects, stay.
            if (route.path.includes('/dashboard/projects')) {
                message.success(`Switched to ${org.name}`)
                return
            }
            
            router.push(`/dashboard/organizations/${org.id}`)
            message.success(`Switched to ${org.name}`)
        }
    }
}

onMounted(() => {
    fetchUserOrgs()
})

// Refetch orgs when user changes (e.g. impersonation)
watch(() => user.value, () => {
    fetchUserOrgs()
})

// Keyboard shortcut for search (Cmd+K / Ctrl+K)
onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('keydown', handleGlobalKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('keydown', handleGlobalKeydown)
  }
})

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showSearch.value = true
  }
}

// Function to render icons consistently
function renderIcon(icon: any) {
  return () => h(icon, null, { default: () => h(icon, { class: 'w-5 h-5' }) })
}

// const { t } = useI18n()

// Map labels to i18n keys
/*
const navLabelMap: Record<string, string> = {
    'Dashboard': 'nav.dashboard',
    'Organizations': 'nav.organizations',
    'Projects': 'nav.projects',
    'Users': 'nav.users',
    'Audit Logs': 'nav.auditLogs',
    'Settings': 'nav.settings',
}
*/

function getLabel(label: string) {
    // const key = navLabelMap[label]
    return label // key ? t(key) : label
}

// Build menu options from navigation config
const menuOptions = computed(() => {
  const items: any[] = []
  
  // Add main nav items
  mainNavItems.forEach(item => {
    // Show Organizations to everyone
    items.push({ label: getLabel(item.label), key: item.path, icon: renderIcon(item.icon) })
  })
  
  // Add admin items if user is admin variables
  if (isAdmin.value && adminNavItems.length > 0) {
    const validAdminItems = adminNavItems.filter(item => {
        if (item.label === 'Users' && !isSuperadmin.value) return false
        return true
    })

    if (validAdminItems.length > 0) {
        items.push({ key: 'd1', type: 'divider' })
        validAdminItems.forEach(item => {
             items.push({ label: getLabel(item.label), key: item.path, icon: renderIcon(item.icon) })
        })
    }
  }
  
  // Add bottom items (settings, etc.)
  if (bottomNavItems.length > 0) {
    items.push({ key: 'd2', type: 'divider' })
    bottomNavItems.forEach(item => {
      items.push({ label: getLabel(item.label), key: item.path, icon: renderIcon(item.icon) })
    })
  }
  
  return items
})

const activeKey = computed(() => route.path)

function handleMenuSelect(key: string) {
  if (key === '/dashboard/organizations' && !isSuperadmin.value && currentOrg.value) {
      router.push(`/dashboard/organizations/${currentOrg.value.id}`)
      return
  }
  router.push(key)
}

function handleUserMenu(key: string) {
  if (key === 'logout') logout()
  else if (key === 'profile') router.push('/dashboard/profile')
  else if (key === 'settings') router.push('/settings')
}

async function handleStopImpersonation() {
  await stopImpersonation()
  router.push('/admin/users')
}

</script>

<template>
  <div class="layout-container">
    <NLayout has-sider style="height: 100vh;">
      <!-- Impersonation Banner (Fixed at top, pushes layout down if active) -->
      <div 
        v-if="isImpersonating" 
        class="impersonation-banner"
      >
        <span>Impersonating <strong>{{ user?.firstName }} {{ user?.lastName }}</strong></span>
        <NButton size="tiny" type="warning" ghost @click="handleStopImpersonation" class="ml-4">
          Stop
        </NButton>
      </div>
      
      <!-- Sidebar -->
      <NLayoutSider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="250"
        :collapsed="collapsed"
        @collapse="collapsed = true"
        @expand="collapsed = false"
        class="sidebar"
        :native-scrollbar="false"
      >
        <div class="sidebar-inner">
          <!-- Team/App Switcher (Top) -->
          <!-- Team/App Switcher (Top) -->
          <div class="sidebar-header" :class="{ 'collapsed': collapsed }">
            <NDropdown trigger="click" :options="orgOptions" @select="handleOrgSelect" size="large">
                <div v-if="!collapsed" class="team-switcher">
                <div class="team-icon">
                    <LayoutGrid class="w-5 h-5" v-if="!currentOrg?.logo" />
                    <img v-else :src="currentOrg.logo" class="w-5 h-5" />
                </div>
                <div class="team-info">
                    <span class="team-name">{{ currentOrg?.name || 'Select Org' }}</span>
                    <span class="team-plan">{{ currentOrg?.plan || 'Free Plan' }}</span>
                </div>
                <div class="ml-auto">
                    <NIcon :component="ChevronsUpDown" class="w-4 h-4 text-muted" />
                </div>
                </div>
                <div v-else class="team-icon-only">
                   <div class="team-icon">
                     <LayoutGrid class="w-5 h-5" v-if="!currentOrg?.logo" />
                     <img v-else :src="currentOrg.logo" class="w-5 h-5" />
                   </div>
                </div>
            </NDropdown>
          </div>

          <!-- Navigation (Scrollable) -->
          <div class="sidebar-content">
            <NMenu
              :collapsed="collapsed"
              :collapsed-width="64"
              :collapsed-icon-size="20"
              :options="menuOptions"
              :value="activeKey"
              @update:value="handleMenuSelect"
              class="sidebar-menu"
            />
          </div>

          <!-- User Profile (Bottom) -->
          <div class="sidebar-footer" :class="{ 'collapsed': collapsed }">
             <NDropdown :options="userMenuOptions" @select="handleUserMenu" placement="right-end" trigger="click">
               <div class="user-profile-btn">
                  <NAvatar round size="small" :style="{ backgroundColor: '#6366f1' }" :src="user?.avatarUrl">
                    {{ user?.firstName?.[0] || 'U' }}
                  </NAvatar>
                  <div v-if="!collapsed" class="user-info">
                    <span class="user-name">{{ user?.firstName }} {{ user?.lastName }}</span>
                    <span class="user-email">{{ user?.email }}</span>
                  </div>
               </div>
             </NDropdown>
          </div>
        </div>
      </NLayoutSider>
      
      <NLayout style="background: var(--bg-color);">
        <!-- Header -->
        <NLayoutHeader bordered class="header">
          <div class="header-content">
            <div class="header-left">
              <!-- Custom Collapse Trigger -->
              <NButton quaternary circle size="small" @click="collapsed = !collapsed" class="mr-4">
                <template #icon>
                  <NIcon :component="PanelLeft" />
                </template>
              </NButton>
              
              <NBreadcrumb>
                <NBreadcrumbItem>
                  <span style="opacity: 0.6">Build Your Super App</span>
                </NBreadcrumbItem>
                <NBreadcrumbItem v-for="crumb in breadcrumbs" :key="crumb.to" @click="router.push(crumb.to)">
                   {{ crumb.label }}
                </NBreadcrumbItem>
              </NBreadcrumb>
            </div>
            <div class="header-right">
              <NButton quaternary size="small" class="search-btn" @click="showSearch = true">
                <template #icon>
                  <NIcon :component="Search" />
                </template>
                <span class="search-label">Search...</span>
                <kbd class="search-kbd">⌘K</kbd>
              </NButton>
            </div>
          </div>
        </NLayoutHeader>
        
        <!-- Content -->
        <NLayoutContent 
          id="main-scroll"
          :native-scrollbar="true" 
          content-style="padding: 24px; min-height: calc(100vh - 64px);"
        >
          <slot />
          <NBackTop :right="100" listen-to="#main-scroll" />
        </NLayoutContent>
      </NLayout>
    </NLayout>
    
    <!-- Search Modal -->
    <SearchModal v-model:show="showSearch" />
  </div>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  background-color: var(--bg-color);
  background-image: 
    radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.08) 0%, transparent 25%);
}

.sidebar {
  background-color: rgba(var(--sidebar-rgb), 0.7) !important; 
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(var(--border-rgb), 0.2) !important;
}

/* Sidebar Header */
.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  margin-bottom: 8px;
}

.team-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent; 
}

.team-switcher:hover {
  background-color: rgba(255, 255, 255, 0.03); 
  border-color: #27272a; 
}

.team-icon {
  width: 32px;
  height: 32px;
  background-color: var(--primary-color, #6366f1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.team-icon-only {
  width: 100%;
  display: flex;
  justify-content: center;
}

.team-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  overflow: hidden;
}

.team-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color);
  white-space: nowrap;
}

.team-plan {
  font-size: 12px;
  color: var(--text-muted);
}

/* Sidebar Footer */
.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: auto; 
  padding: 12px 24px 12px 12px; /* Extra right padding */
  border-top: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color); 
  background-color: var(--sidebar-bg);
  box-sizing: border-box; 
  z-index: 10;
  transition: padding 0.2s ease;
}

.sidebar-footer.collapsed {
  padding: 12px 0;
  display: flex;
  justify-content: center;
}

.user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background-color 0.2s;
  width: 100%;
}

/* Ensure avatar isn't squashed */
.user-profile-btn :deep(.n-avatar) {
  flex-shrink: 0;
}

.sidebar-footer.collapsed .user-profile-btn {
  width: auto; /* Allow sizing to content */
  justify-content: center;
  padding: 8px;
}

.user-profile-btn:hover {
  background-color: #27272a;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  overflow: hidden;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
}

.user-email {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 140px;
}

/* Impersonation Banner */
.impersonation-banner {
  background: #f59e0b;
  color: #000;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Header */
.header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background-color: transparent; 
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--border-color, #27272a);
  border-radius: 6px;
}

.search-label {
  color: var(--text-muted, #a1a1aa);
  font-size: 14px;
}

.search-kbd {
  background: var(--border-color, #27272a);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-muted, #a1a1aa);
  margin-left: 8px;
}

/* Utilities */
.w-5 { width: 20px; }
.h-5 { height: 20px; }
.w-6 { width: 24px; }
.h-6 { height: 24px; }
.mr-4 { margin-right: 16px; }
.ml-4 { margin-left: 16px; }
</style>
