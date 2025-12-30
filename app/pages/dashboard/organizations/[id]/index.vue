<script setup lang="ts">
import { NCard, NDescriptions, NDescriptionsItem, NButton, NSpace, NDataTable, NEmpty, useMessage, NPopconfirm, NAvatar, NAvatarGroup, NGrid, NGridItem, NTag, NIcon } from 'naive-ui'
import { Users, LayoutGrid, Trash2, ArrowLeft, Settings } from 'lucide-vue-next'

definePageMeta({
  title: 'Organization Details',
})

const route = useRoute()
const router = useRouter()
const message = useMessage()
const api = useApi()
const { user, isAdmin, isSuperadmin } = useAuth()

const loading = ref(true)
const org = ref<any>(null)
const members = ref<any[]>([])

// Computed for avatar group
const memberAvatarOptions = computed(() => {
  return members.value.slice(0, 5).map(m => ({
    name: `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim() || 'Member',
    src: m.user?.avatar || undefined,
  }))
})

const membersOverflow = computed(() => {
  const total = members.value.length
  return total > 3 ? `+${total - 3} others` : ''
})

const projectColumns = [
  { title: 'Name', key: 'name' },
  { 
      title: 'Status', 
      key: 'status',
      render(row: any) {
          return h(NTag, { type: row.status === 'active' ? 'success' : 'default', size: 'small', bordered: false }, { default: () => row.status })
      }
  },
  { title: 'Created', key: 'createdAt', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
]

const isOwner = computed(() => org.value?.ownerId === user.value?.id)
const canEdit = computed(() => isOwner.value || isAdmin.value)

async function fetchOrganization() {
  loading.value = true
  try {
    const res = await api.get<{ organization: any }>(`/organizations/${route.params.id}`)
    org.value = res.organization
    // Fetch members
    await fetchMembers()
  } catch (e) {
    message.error('Failed to load organization')
    router.push('/dashboard/organizations')
  } finally {
    loading.value = false
  }
}

async function fetchMembers() {
  try {
    const res = await api.get<{ members: any[] }>(`/organizations/${route.params.id}/members`)
    members.value = res.members
  } catch (e) {
    // Silent fail - members section will show empty
    members.value = []
  }
}

async function handleDelete() {
  try {
    await api.delete(`/organizations/${route.params.id}`)
    message.success('Organization deleted')
    router.push('/dashboard/organizations')
  } catch (error: any) {
    message.error(error?.data?.statusMessage || 'Failed to delete')
  }
}

onMounted(fetchOrganization)
</script>

<template>
  <div v-if="org">
    <!-- Back Navigation -->
    <!-- Back Navigation -->
    <div class="mb-6" v-if="isSuperadmin">
        <NButton text @click="router.push('/dashboard/organizations')">
            <template #icon><NIcon :component="ArrowLeft" /></template>
            Back to Organizations
        </NButton>
    </div>

    <!-- Hero Banner -->
    <div class="org-banner mb-6">
        <div class="banner-row">
            <NAvatar :size="56" :src="org.logo" class="avatar-logo" :style="{ backgroundColor: 'white', color: 'var(--primary-color)' }">
                <NIcon :component="LayoutGrid" v-if="!org.logo" />
            </NAvatar>
            <div class="banner-info">
                <div class="banner-title-row">
                    <h1 class="banner-title">{{ org.name }}</h1>
                    <NPopconfirm @positive-click="handleDelete" v-if="canEdit">
                        <template #trigger>
                            <NButton size="small" secondary class="delete-btn">
                                <template #icon><NIcon :component="Trash2" /></template>
                               Delete
                            </NButton>
                        </template>
                        Are you sure you want to delete this organization?
                    </NPopconfirm>
                </div>
                <div class="banner-meta">
                    <NTag size="small" :bordered="false" round class="banner-tag font-mono">
                        {{ org.slug }}
                    </NTag>
                    <span class="banner-date">Created {{ new Date(org.createdAt).toLocaleDateString() }}</span>
                </div>
            </div>
        </div>
    </div>
    
    <NGrid :x-gap="24" :y-gap="24" cols="1 m:3" responsive="screen">
        <!-- Main Content -->
        <NGridItem span="2">
            <NCard title="Projects" :bordered="false" size="medium" class="h-full shadow-sm">
                <template #header-extra>
                   <NButton size="small" secondary>
                       <template #icon><NIcon :component="LayoutGrid" /></template>
                       View All
                   </NButton>
                </template>
                <NDataTable :columns="projectColumns" :data="org.projects || []" :loading="loading" :bordered="false" />
                <div v-if="!loading && (!org.projects || org.projects.length === 0)" class="py-12 text-center">
                    <div class="mb-3">
                        <NIcon :component="LayoutGrid" size="40" class="text-gray-300" />
                    </div>
                    <p class="text-muted mb-4">No projects yet.</p>
                    <NButton size="small" type="primary">Create Project</NButton>
                </div>
            </NCard>
        </NGridItem>

        <!-- Sidebar / Meta -->
        <NGridItem>
            <NSpace vertical size="large">
                <!-- Team Section -->
                <NCard title="Team Access" :bordered="false" size="medium" class="shadow-sm">
                    <div class="flex flex-col gap-5">
                        <p class="text-muted text-sm">Manage who has access to this organization.</p>
                        
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                             <NAvatarGroup :options="memberAvatarOptions" :size="32" :max="3" />
                             <span v-if="membersOverflow" class="text-xs text-muted font-medium">{{ membersOverflow }}</span>
                             <span v-else class="text-xs text-muted font-medium">{{ members.length }} member{{ members.length !== 1 ? 's' : '' }}</span>
                        </div>

                        <NButton block type="primary" @click="router.push(`/dashboard/organizations/${org.id}/members`)">
                            <template #icon><NIcon :component="Users" /></template>
                            Manage Team
                        </NButton>
                    </div>
                </NCard>

                <!-- Details Section -->
                <NCard title="Details" :bordered="false" size="medium" class="shadow-sm">
                     <div class="flex flex-col gap-4">
                        <div>
                            <div class="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Description</div>
                            <div class="text-sm leading-relaxed">{{ org.description || 'No description provided.' }}</div>
                        </div>
                        
                        <div>
                            <div class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Owner</div>
                            <div class="owner-row">
                                <NAvatar :size="36" round :src="org.owner?.avatar" :style="{ backgroundColor: '#6366f1', color: 'white', flexShrink: 0 }">
                                    {{ org.owner?.firstName?.[0] }}
                                </NAvatar>
                                <div class="owner-info">
                                    <div class="owner-name">{{ org.owner?.firstName }} {{ org.owner?.lastName }}</div>
                                    <div class="owner-email">{{ org.owner?.email }}</div>
                                </div>
                            </div>
                        </div>
                     </div>
                </NCard>
            </NSpace>
        </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped>
.org-banner {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%);
    border-radius: 12px;
    padding: 20px 24px;
    overflow: hidden;
}

/* Banner horizontal layout */
.banner-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
}

.avatar-logo {
    flex-shrink: 0;
}

.banner-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.banner-title-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.banner-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
    line-height: 1.2;
}

.banner-meta {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.banner-tag {
    background-color: rgba(255, 255, 255, 0.2);
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.banner-date {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
}

.delete-btn {
    background-color: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.25) !important;
    color: white !important;
}

.delete-btn:hover {
    background-color: rgba(255, 80, 80, 0.3) !important;
    border-color: rgba(255, 80, 80, 0.5) !important;
    color: #fecaca !important;
}

/* Owner section horizontal layout */
.owner-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 8px;
    margin-left: -8px;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.owner-row:hover {
    background-color: rgba(128, 128, 128, 0.1);
}

.owner-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.owner-name {
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.3;
}

.owner-email {
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.3;
}

/* Fix text colors */
.text-muted { color: var(--text-muted); }
</style>
