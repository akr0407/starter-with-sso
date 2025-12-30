<script setup lang="ts">
import { NCard, NDataTable, NButton, NSpace, NInput, NTag, useMessage, NPagination, NPopconfirm } from 'naive-ui'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
    title: 'User Management',
})

const message = useMessage()
const api = useApi()
const { user: currentUser, isSuperadmin, impersonateUser } = useAuth()

const loading = ref(true)
const users = ref<any[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0 })
const search = ref('')

const roleColors: Record<string, string> = {
  user: 'default',
  admin: 'info',
  superadmin: 'success',
}

const columns = computed(() => [
  { title: 'Name', key: 'name', render: (row: any) => `${row.firstName} ${row.lastName}` },
  { title: 'Email', key: 'email' },
  { 
    title: 'Role', 
    key: 'role',
    render: (row: any) => h(NTag, { type: roleColors[row.role] as any, size: 'small' }, { default: () => row.role }),
  },
  { 
    title: 'Status', 
    key: 'isActive',
    render: (row: any) => h(NTag, { type: row.isActive ? 'success' : 'error', size: 'small' }, { default: () => row.isActive ? 'Active' : 'Inactive' }),
  },
  { title: 'Joined', key: 'createdAt', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
  { 
    title: 'Actions', 
    key: 'actions',
    render: (row: any) => {
      if (row.id === currentUser.value?.id) return null
      return h(NSpace, {}, {
        default: () => [
          isSuperadmin.value && row.role !== 'superadmin' && h(NPopconfirm, {
            onPositiveClick: () => handleImpersonate(row.id),
          }, {
            trigger: () => h(NButton, { size: 'small', type: 'warning', ghost: true }, { default: () => 'Impersonate' }),
            default: () => `Impersonate ${row.firstName}?`,
          }),
        ],
      })
    },
  },
])

async function fetchUsers() {
  loading.value = true
  try {
    const res = await api.get<{ data: any[]; pagination: any }>('/users', {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: search.value || undefined,
    })
    users.value = res.data
    pagination.value.total = res.pagination.total
  } catch (e) {
    message.error('Failed to load users')
  } finally {
    loading.value = false
  }
}

async function handleImpersonate(userId: number) {
  try {
    await impersonateUser(userId)
    message.success('Now impersonating user')
    navigateTo('/dashboard')
  } catch (error: any) {
    message.error(error?.data?.statusMessage || 'Failed to impersonate')
  }
}

const debouncedSearch = useDebounceFn(() => {
  pagination.value.page = 1
  fetchUsers()
}, 300)

watch(search, debouncedSearch)
onMounted(fetchUsers)
</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" class="mb-4">
      <h2 style="margin: 0;">Users</h2>
      <NInput v-model:value="search" placeholder="Search users..." style="width: 300px;" clearable />
    </NSpace>
    
    <NCard>
      <NDataTable :columns="columns" :data="users" :loading="loading" :pagination="false" :scroll-x="800" />
    </NCard>
    
    <NPagination
      v-if="pagination.total > pagination.limit"
      v-model:page="pagination.page"
      :page-count="Math.ceil(pagination.total / pagination.limit)"
      @update:page="fetchUsers"
      class="mt-4"
    />
  </div>
</template>

<style scoped>
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
</style>
