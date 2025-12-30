<script setup lang="ts">
import { NCard, NDataTable, NSpace, NSelect, NTag, useMessage, NPagination, NDescriptions, NDescriptionsItem, NModal, NButton } from 'naive-ui'

definePageMeta({
    title: 'Audit Logs',
})

const message = useMessage()
const api = useApi()

const loading = ref(true)
const logs = ref<any[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0 })
const filters = reactive({
  tableName: null as string | null,
  action: null as string | null,
})
const selectedLog = ref<any>(null)
const showDetailModal = ref(false)

const actionColors: Record<string, string> = {
  INSERT: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  VIEW: 'warning',
}

const tableOptions = [
  { label: 'All Tables', value: null },
  { label: 'Users', value: 'users' },
  { label: 'Organizations', value: 'organizations' },
  { label: 'Projects', value: 'projects' },
]

const actionOptions = [
  { label: 'All Actions', value: null },
  { label: 'INSERT', value: 'INSERT' },
  { label: 'UPDATE', value: 'UPDATE' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'VIEW', value: 'VIEW' },
]

const columns = [
  { title: 'Time', key: 'createdAt', width: 180, render: (row: any) => new Date(row.createdAt).toLocaleString() },
  { title: 'Table', key: 'tableName', width: 120 },
  { 
    title: 'Action', 
    key: 'action', 
    width: 100,
    render: (row: any) => h(NTag, { type: actionColors[row.action] as any, size: 'small' }, { default: () => row.action }),
  },
  { title: 'Record ID', key: 'recordId', width: 100 },
  { 
    title: 'User', 
    key: 'user',
    render: (row: any) => row.user ? `${row.user.firstName} ${row.user.lastName}` : 'System',
  },
  { 
    title: 'Impersonated By', 
    key: 'impersonator',
    render: (row: any) => row.impersonator ? h(NTag, { type: 'warning', size: 'small' }, { default: () => `${row.impersonator.firstName} ${row.impersonator.lastName}` }) : '-',
  },
  { 
    title: '', 
    key: 'actions',
    width: 80,
    render: (row: any) => h(NButton, { size: 'small', onClick: () => viewDetail(row) }, { default: () => 'View' }),
  },
]

function viewDetail(log: any) {
  selectedLog.value = log
  showDetailModal.value = true
}

async function fetchLogs() {
  loading.value = true
  try {
    const res = await api.get<{ data: any[]; pagination: any }>('/admin/audit-logs', {
      page: pagination.value.page,
      limit: pagination.value.limit,
      tableName: filters.tableName || undefined,
      action: filters.action || undefined,
    })
    logs.value = res.data
    pagination.value.total = res.pagination.total
  } catch (e) {
    message.error('Failed to load audit logs')
  } finally {
    loading.value = false
  }
}

watch([() => filters.tableName, () => filters.action], () => {
  pagination.value.page = 1
  fetchLogs()
})

onMounted(fetchLogs)
</script>

<template>
  <div>
    <NSpace justify="space-between" align="center" class="mb-4">
      <h2 style="margin: 0;">Audit Logs</h2>
      <NSpace>
        <NSelect v-model:value="filters.tableName" :options="tableOptions" style="width: 150px;" />
        <NSelect v-model:value="filters.action" :options="actionOptions" style="width: 150px;" />
      </NSpace>
    </NSpace>
    
    <NCard>
      <NDataTable :columns="columns" :data="logs" :loading="loading" :pagination="false" :scroll-x="1000" />
    </NCard>
    
    <NPagination
      v-if="pagination.total > pagination.limit"
      v-model:page="pagination.page"
      :page-count="Math.ceil(pagination.total / pagination.limit)"
      @update:page="fetchLogs"
      class="mt-4"
    />
    
    <!-- Detail Modal -->
    <NModal v-model:show="showDetailModal" title="Audit Log Details" preset="card" style="max-width: 700px;">
      <NDescriptions v-if="selectedLog" label-placement="left" :column="1" bordered>
        <NDescriptionsItem label="Time">{{ new Date(selectedLog.createdAt).toLocaleString() }}</NDescriptionsItem>
        <NDescriptionsItem label="Table">{{ selectedLog.tableName }}</NDescriptionsItem>
        <NDescriptionsItem label="Action">
          <NTag :type="actionColors[selectedLog.action] as any">{{ selectedLog.action }}</NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="Record ID">{{ selectedLog.recordId }}</NDescriptionsItem>
        <NDescriptionsItem label="User">
          {{ selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName} (${selectedLog.user.email})` : 'System' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="IP Address">{{ selectedLog.ipAddress || 'N/A' }}</NDescriptionsItem>
        <NDescriptionsItem label="Old Data">
          <pre style="margin: 0; white-space: pre-wrap; font-size: 12px;">{{ selectedLog.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : 'N/A' }}</pre>
        </NDescriptionsItem>
        <NDescriptionsItem label="New Data">
          <pre style="margin: 0; white-space: pre-wrap; font-size: 12px;">{{ selectedLog.newData ? JSON.stringify(selectedLog.newData, null, 2) : 'N/A' }}</pre>
        </NDescriptionsItem>
      </NDescriptions>
    </NModal>
  </div>
</template>

<style scoped>
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
</style>
