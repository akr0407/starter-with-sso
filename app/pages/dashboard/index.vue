<script setup lang="ts">
import { NCard, NStatistic, NGrid, NGridItem, NSpace, NSkeleton, NButton, NIcon } from 'naive-ui'
import { Building2, Folder, Users } from 'lucide-vue-next'

definePageMeta({
    title: 'Dashboard',
})

const { user, isAdmin, isSuperadmin } = useAuth()
const api = useApi()
const loading = ref(true)
const stats = ref({ organizations: 0, projects: 0, users: 0 })

async function fetchStats() {
  loading.value = true
  try {
    const [orgsRes, projectsRes] = await Promise.all([
      api.get<{ pagination: { total: number } }>('/organizations', { limit: 1 }),
      api.get<{ pagination: { total: number } }>('/projects', { limit: 1 }),
    ])
    stats.value.organizations = orgsRes.pagination?.total ?? 0
    stats.value.projects = projectsRes.pagination?.total ?? 0
    
    // If stats updated from onboarding, we might want to refresh?
    // Actually the OnboardingWizard emits 'complete', so we can listen to that.
    
    if (isAdmin.value) {
      const usersRes = await api.get<{ pagination: { total: number } }>('/users', { limit: 1 })
      stats.value.users = usersRes.pagination?.total ?? 0
    }
  } catch (e) {
    console.error('Failed to fetch stats', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<template>
  <div>
    <NCard :bordered="false" class="welcome-card mb-6">
      <h2 class="welcome-title">
        Welcome back, {{ user?.firstName }}! 👋 
        <span class="role-badge" :class="user?.role">{{ user?.role?.toUpperCase() }}</span>
      </h2>
      <p class="welcome-subtitle">Here's an overview of your workspace.</p>
    </NCard>
    
    <NGrid x-gap="12" y-gap="12" cols="1 s:3" responsive="screen">
      <NGridItem>
        <NCard :bordered="false" class="compact-stat-card">
          <div class="stat-row">
            <div class="stat-icon org-icon">
              <NIcon :component="Building2" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-label">Organizations</span>
              <NSkeleton v-if="loading" width="40px" />
              <span v-else class="stat-value">{{ stats.organizations }}</span>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard :bordered="false" class="compact-stat-card">
          <div class="stat-row">
            <div class="stat-icon project-icon">
              <NIcon :component="Folder" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-label">Projects</span>
              <NSkeleton v-if="loading" width="40px" />
              <span v-else class="stat-value">{{ stats.projects }}</span>
            </div>
          </div>
        </NCard>
      </NGridItem>
      <NGridItem v-if="isAdmin">
        <NCard :bordered="false" class="compact-stat-card">
          <div class="stat-row">
            <div class="stat-icon user-icon">
              <NIcon :component="Users" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-label">Users</span>
              <NSkeleton v-if="loading" width="40px" />
              <span v-else class="stat-value">{{ stats.users }}</span>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
    
    <NCard title="Activity Overview" class="mb-6 mt-6">
      <DashboardChart />
    </NCard>
    
    <div class="mt-6">
      <NGrid x-gap="24" y-gap="24" cols="1 l:2">
      <NGridItem>
        <NCard title="Quick Actions" :bordered="true">
          <NSpace size="large">
            <NButton type="primary" @click="navigateTo('/dashboard/organizations')">
              View Organizations
            </NButton>
            <NButton @click="navigateTo('/dashboard/projects')">
              View Projects
            </NButton>
            <NButton v-if="isAdmin" tertiary @click="navigateTo('/admin/users')">
              Manage Users
            </NButton>
          </NSpace>
        </NCard>
      </NGridItem>
      <NGridItem>
        <ActivityFeed />
      </NGridItem>
    </NGrid>
    </div>
    
    <OnboardingWizard @complete="fetchStats" />
  </div>
</template>

<style scoped>
.welcome-card {
  background: transparent; 
  /* Minimal aesthetic - let the global bg show or use a very subtle surface */
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--n-text-color);
}

.welcome-subtitle {
  color: #a1a1aa;
  margin: 0;
  font-size: 14px;
}

.compact-stat-card {
  transition: all 0.2s ease;
}
.compact-stat-card:hover {
  transform: translateY(-2px);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.org-icon {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}
.project-icon {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}
.user-icon {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 13px;
  color: #a1a1aa;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--n-text-color);
}

.role-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(161, 161, 170, 0.1);
  color: #a1a1aa;
  vertical-align: middle;
  margin-left: 8px;
  font-weight: 500;
  display: inline-block;
  line-height: 1.2;
}

.role-badge.superadmin {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7; /* Purple */
}
.role-badge.admin {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1; /* Indigo */
}
.role-badge.user {
  background: rgba(161, 161, 170, 0.15);
  color: #a1a1aa; /* Gray */
}

.mt-6 {
  margin-top: 24px;
}
.mb-6 {
  margin-bottom: 24px;
}
</style>
