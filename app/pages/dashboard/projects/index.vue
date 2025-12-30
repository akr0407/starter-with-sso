<script setup lang="ts">
import { NCard, NDataTable, NButton, NSpace, NModal, NForm, NFormItem, NInput, NSelect, useMessage, NEmpty, NTag } from 'naive-ui'

definePageMeta({
    title: 'Projects',
})

const message = useMessage()
const api = useApi()
const { currentOrg, userOrgs } = useOrganization()

const loading = ref(true)
const projects = ref<any[]>([])
const showCreateModal = ref(false)
const creating = ref(false)

const formRef = ref()
const formData = reactive({
  name: '',
  description: '',
  organizationId: null as number | null,
})

const statusColors: Record<string, string> = {
  active: 'success',
  completed: 'info',
  archived: 'warning',
}

const columns = [
  { title: 'Name', key: 'name' },
  { title: 'Organization', key: 'organization', render: (row: any) => row.organization?.name },
  { 
    title: 'Status', 
    key: 'status',
    render: (row: any) => h(NTag, { type: statusColors[row.status] as any, size: 'small' }, { default: () => row.status }),
  },
  { title: 'Created', key: 'createdAt', render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
]

async function fetchProjects() {
  if (!currentOrg.value) {
      projects.value = []
      loading.value = false
      return
  }

  loading.value = true
  try {
    const res = await api.get<{ data: any[] }>('/projects', { organizationId: currentOrg.value.id })
    projects.value = res.data
  } catch (e) {
    message.error('Failed to load projects')
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
    await api.post('/projects', formData)
    message.success('Project created!')
    showCreateModal.value = false
    formData.name = ''
    formData.description = ''
    formData.organizationId = currentOrg.value?.id || null
    fetchProjects()
  } catch (error: any) {
    message.error(error?.data?.statusMessage || 'Failed to create')
  } finally {
    creating.value = false
  }
}

const orgOptions = computed(() => 
  userOrgs.value.map(org => ({ label: org.name, value: org.id }))
)

// Watch for org changes
watch(() => currentOrg.value, () => {
    fetchProjects()
    // Update create form default
    if (currentOrg.value) {
        formData.organizationId = currentOrg.value.id
    }
}, { immediate: true })

</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" class="mb-4">
      <h2 style="margin: 0;">Projects</h2>
      <NButton type="primary" @click="showCreateModal = true" :disabled="userOrgs.length === 0">
        + New Project
      </NButton>
    </NSpace>
    
    <NCard>
      <NDataTable :columns="columns" :data="projects" :loading="loading" :scroll-x="600" />
      <EmptyState
        v-if="!loading && projects.length === 0"
        title="No Projects Yet"
        description="Projects in this organization will appear here."
        :show-action="!!currentOrg"
        action-label="Create Project"
        @action="showCreateModal = true"
      />
    </NCard>
    
    <!-- Create Modal -->
    <NModal v-model:show="showCreateModal" title="Create Project" preset="card" style="max-width: 500px;">
      <NForm ref="formRef" :model="formData">
        <NFormItem label="Organization" path="organizationId" :rule="{ required: true, type: 'number', message: 'Required' }">
          <NSelect v-model:value="formData.organizationId" :options="orgOptions" placeholder="Select organization" disabled />
          <!-- Note: Disabled selection to enforce creation in current context, or allow if desired? User asked to scope to current org. -->
        </NFormItem>
        <NFormItem label="Name" path="name" :rule="{ required: true, message: 'Required' }">
          <NInput v-model:value="formData.name" placeholder="Project name" />
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
</style>
