<script setup lang="ts">
import { NCard, NDataTable, NButton, NTag, NDropdown, NIcon, NModal, NInput, NSelect, useMessage, NSpace, NAvatar, NPopconfirm } from 'naive-ui'
import { MoreHorizontal, Plus, ArrowLeft } from 'lucide-vue-next'

definePageMeta({
  title: 'Team Members'
})

const route = useRoute()
const router = useRouter()
const message = useMessage()
const api = useApi()
const { user: currentUser, isSuperadmin } = useAuth()

const orgId = route.params.id as string

interface Member {
  id: number
  organizationId: number
  userId: number
  role: 'owner' | 'admin' | 'member'
  createdAt: string
  isOwner?: boolean
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
    role?: string
  }
  invitedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
}

// --- State ---
const members = ref<Member[]>([])
const loading = ref(true)
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<'admin' | 'member'>('member')
const inviting = ref(false)

// --- Fetch Members ---
async function fetchMembers() {
  loading.value = true
  try {
    const res = await api.get<{ members: Member[] }>(`/organizations/${orgId}/members`)
    members.value = res.members
  } catch (e: any) {
    message.error(e?.data?.statusMessage || 'Failed to load members')
  } finally {
    loading.value = false
  }
}

// --- Columns ---
const columns = [
  {
    title: 'User',
    key: 'user',
    render(row: Member) {
      const name = `${row.user.firstName} ${row.user.lastName}`
      return h(NSpace, { align: 'center' }, {
        default: () => [
          h(NAvatar, { 
            round: true, 
            size: 'small', 
            style: 'background-color: var(--primary-color); color: white;' 
          }, { default: () => row.user.firstName?.charAt(0) || 'U' }),
          h('div', [
             h('div', { style: 'font-weight: 500' }, name),
             h('div', { style: 'font-size: 12px; color: var(--text-muted)' }, row.user.email)
          ])
        ]
      })
    }
  },
  {
    title: 'Role',
    key: 'role',
    render(row: Member) {
      const colors: Record<string, 'warning' | 'success' | 'default'> = { 
        owner: 'warning', 
        admin: 'success', 
        member: 'default' 
      }
      return h(NTag, { 
        type: colors[row.role] || 'default', 
        bordered: false 
      }, { default: () => row.role.toUpperCase() })
    }
  },
  {
    title: '',
    key: 'actions',
    width: 60,
    render(row: Member) {
      // Don't show actions for owner
      if (row.isOwner) return null
      
      const options = [
        { label: 'Make Admin', key: 'admin', show: row.role === 'member' },
        { label: 'Make Member', key: 'member', show: row.role === 'admin' },
        { type: 'divider', key: 'd1' },
        { label: 'Remove', key: 'remove', props: { style: 'color: #ef4444' } }
      ].filter(o => o.show !== false)
      
      return h(NDropdown, {
        trigger: 'click',
        options,
        onSelect: (key: string) => handleAction(key, row)
      }, {
        default: () => h(NButton, { 
          quaternary: true, 
          circle: true 
        }, { 
          default: () => h(NIcon, { component: MoreHorizontal }) 
        })
      })
    }
  }
]

// --- Actions ---
async function handleAction(key: string, row: Member) {
  if (key === 'remove') {
    try {
      await api.delete(`/organizations/${orgId}/members/${row.id}`)
      members.value = members.value.filter(m => m.id !== row.id)
      message.success(`Removed ${row.user.firstName} ${row.user.lastName}`)
    } catch (e: any) {
      message.error(e?.data?.statusMessage || 'Failed to remove member')
    }
  } else if (key === 'admin' || key === 'member') {
    try {
      await api.patch(`/organizations/${orgId}/members/${row.id}`, { role: key })
      const member = members.value.find(m => m.id === row.id)
      if (member) member.role = key as 'admin' | 'member'
      message.success(`Updated role to ${key}`)
    } catch (e: any) {
      message.error(e?.data?.statusMessage || 'Failed to update role')
    }
  }
}

async function handleInvite() {
  if (!inviteEmail.value) return
  inviting.value = true
  
  try {
    const res = await api.post<{ member: Member }>(`/organizations/${orgId}/members`, {
      email: inviteEmail.value,
      role: inviteRole.value,
    })
    members.value.push(res.member)
    message.success(`Added ${inviteEmail.value} to the team`)
    showInviteModal.value = false
    inviteEmail.value = ''
    inviteRole.value = 'member'
  } catch (e: any) {
    message.error(e?.data?.statusMessage || 'Failed to invite member')
  } finally {
    inviting.value = false
  }
}

onMounted(fetchMembers)
</script>

<template>
  <div>
    <NButton text class="mb-4" @click="router.push(`/dashboard/organizations/${orgId}`)">
      <template #icon><NIcon :component="ArrowLeft" /></template>
      Back to Organization
    </NButton>

    <div class="page-header">
      <div>
        <h1 class="page-title">Team Members</h1>
        <p class="page-subtitle">Manage who has access to this organization.</p>
      </div>
      <NButton type="primary" @click="showInviteModal = true">
        <template #icon><NIcon :component="Plus" /></template>
        Add Member
      </NButton>
    </div>

    <NCard :bordered="false" content-style="padding: 0;">
      <NDataTable 
        :columns="columns" 
        :data="members" 
        :loading="loading"
        :bordered="false" 
      />
    </NCard>

    <!-- Invite Modal -->
    <NModal v-model:show="showInviteModal">
      <NCard style="width: 400px" title="Add Team Member" :bordered="false" size="huge">
        <NSpace vertical size="large">
            <div>
                <label>Email Address</label>
                <NInput v-model:value="inviteEmail" placeholder="colleague@company.com" />
                <p class="field-hint">User must already have an account</p>
            </div>
            <div>
                 <label>Role</label>
                 <NSelect v-model:value="inviteRole" :options="[
                     { label: 'Member', value: 'member' },
                     { label: 'Admin', value: 'admin' }
                 ]" />
            </div>
            <div class="modal-actions">
                <NButton @click="showInviteModal = false">Cancel</NButton>
                <NButton type="primary" :loading="inviting" :disabled="!inviteEmail" @click="handleInvite">
                  Add to Team
                </NButton>
            </div>
        </NSpace>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}
.page-subtitle {
  color: var(--text-muted);
  margin: 4px 0 0 0;
}
label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text-color);
}
.field-hint {
    font-size: 12px;
    color: var(--text-muted);
    margin: 4px 0 0 0;
}
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;
}
</style>
