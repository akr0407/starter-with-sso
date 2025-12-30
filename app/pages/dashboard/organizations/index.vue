<script setup lang="ts">
import { NCard, NDataTable, NButton, NSpace, NModal, NForm, NFormItem, NInput, useMessage, NEmpty, NPagination } from 'naive-ui'

definePageMeta({
    title: 'Organizations',
})

const message = useMessage()
const api = useApi()

const loading = ref(true)
const organizations = ref<any[]>([])
const pagination = ref({ page: 1, limit: 10, total: 0 })
const showCreateModal = ref(false)
const creating = ref(false)

const formRef = ref()
const formData = reactive({
  name: '',
  slug: '',
  description: '',
})

const columns = [
  { title: 'Name', key: 'name' },
  { title: 'Slug', key: 'slug' },
  { title: 'Owner', key: 'owner', render: (row: any) => `${row.owner?.firstName} ${row.owner?.lastName}` },
  { title: 'Created', key: 'createdAt', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
  { 
    title: 'Actions', 
    key: 'actions',
    render: (row: any) => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'small', onClick: () => navigateTo(`/dashboard/organizations/${row.id}`) }, { default: () => 'View' }),
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => navigateTo(`/dashboard/organizations/${row.id}/members`) }, { default: () => 'Team' })
      ]
    }),
  },
]

async function fetchOrganizations() {
  loading.value = true
  try {
    const res = await api.get<{ data: any[]; pagination: any }>('/organizations', {
      page: pagination.value.page,
      limit: pagination.value.limit,
    })
    organizations.value = res.data
    pagination.value.total = res.pagination.total
  } catch (e) {
    message.error('Failed to load organizations')
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  try {
    await formRef.value?.validate()
  } catch { return }
  
  creating.value = true
  try {
    await api.post('/organizations', formData)
    message.success('Organization created!')
    showCreateModal.value = false
    formData.name = ''
    formData.slug = ''
    formData.description = ''
    fetchOrganizations()
  } catch (error: any) {
    message.error(error?.data?.statusMessage || 'Failed to create')
  } finally {
    creating.value = false
  }
}

// Auto-generate slug from name
watch(() => formData.name, (name) => {
  formData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
})

onMounted(fetchOrganizations)
</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" class="mb-4">
      <h2 style="margin: 0;">Organizations</h2>
      <NButton type="primary" @click="showCreateModal = true">+ New Organization</NButton>
    </NSpace>
    
    <NCard>
      <NDataTable
        :columns="columns"
        :data="organizations"
        :loading="loading"
        :pagination="false"
        :scroll-x="700"
      />
      <EmptyState
        v-if="!loading && organizations.length === 0"
        title="No Organizations"
        description="Organizations group your projects and team members."
        show-action
        action-label="Create Organization"
        @action="showCreateModal = true"
      />
    </NCard>
    
    <NPagination
      v-if="pagination.total > pagination.limit"
      v-model:page="pagination.page"
      :page-count="Math.ceil(pagination.total / pagination.limit)"
      @update:page="fetchOrganizations"
      class="mt-4"
    />
    
    <!-- Create Modal -->
    <NModal v-model:show="showCreateModal" title="Create Organization" preset="card" style="max-width: 500px;">
      <NForm ref="formRef" :model="formData">
        <NFormItem label="Name" path="name" :rule="{ required: true, message: 'Required' }">
          <NInput v-model:value="formData.name" placeholder="My Organization" />
        </NFormItem>
        <NFormItem label="Slug" path="slug" :rule="{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers, and hyphens only' }">
          <NInput v-model:value="formData.slug" placeholder="my-organization" />
        </NFormItem>
        <NFormItem label="Description" path="description">
          <NInput v-model:value="formData.description" type="textarea" placeholder="Optional description" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">Cancel</NButton>
          <NButton type="primary" :loading="creating" @click="handleCreate">Create</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped>
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
</style>
