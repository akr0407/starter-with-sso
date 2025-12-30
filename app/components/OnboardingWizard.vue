<script setup lang="ts">
import { NModal, NCard, NSteps, NStep, NButton, NInput, NSpace, useMessage } from 'naive-ui'
import { Rocket, Building2, CheckCircle } from 'lucide-vue-next'

const show = ref(false)
const currentStep = ref(1)
const loading = ref(false)
const orgName = ref('')
const message = useMessage()
const api = useApi()
const { user } = useAuth()

const emit = defineEmits(['complete'])

// Check if user needs onboarding (no organizations)
async function checkStatus() {
  try {
    const res = await api.get<{ pagination: { total: number } }>('/organizations', { limit: 1 })
    if (res.pagination.total === 0) {
      show.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

async function createOrganization() {
  if (!orgName.value) return
  loading.value = true
  try {
    await api.post('/organizations', { name: orgName.value })
    message.success('Organization created!')
    currentStep.value = 3
    emit('complete') // Trigger refresh in parent
  } catch (e) {
    message.error('Failed to create organization')
  } finally {
    loading.value = false
  }
}

function finish() {
  show.value = false
  message.success("You're all set!")
}

onMounted(() => {
  checkStatus()
})
</script>

<template>
  <NModal v-model:show="show" :mask-closable="false" :closable="false">
    <NCard
      style="width: 600px; max-width: 90vw;"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <div class="header">
        <h2>Welcome to SaaS Starter</h2>
        <p>Let's get your workspace ready in less than a minute.</p>
      </div>

      <div class="steps-container">
        <NSteps :current="currentStep" status="process">
          <NStep title="Welcome" description="Get started" />
          <NStep title="Organization" description="Create workspace" />
          <NStep title="Ready" description="Start building" />
        </NSteps>
      </div>

      <div class="content">
        <!-- Step 1: Welcome -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="icon-wrapper">
            <Rocket :size="48" color="#6366f1" />
          </div>
          <h3>Hello, {{ user?.firstName }}!</h3>
          <p>We're excited to have you on board. Set up your organization to start managing projects and teammates.</p>
          <div class="actions">
            <NButton type="primary" size="large" @click="currentStep = 2">
              Let's Go
            </NButton>
          </div>
        </div>

        <!-- Step 2: Create Org -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="icon-wrapper">
            <Building2 :size="48" color="#a855f7" />
          </div>
          <h3>Name your Organization</h3>
          <p>This will be your team's home base.</p>
          <div class="form-wrapper">
            <NInput 
              v-model:value="orgName" 
              placeholder="e.g. Acme Corp, Design Team" 
              size="large"
              @keyup.enter="createOrganization"
            />
          </div>
          <div class="actions">
            <NButton @click="currentStep = 1">Back</NButton>
            <NButton type="primary" :loading="loading" :disabled="!orgName" @click="createOrganization">
              Create & Continue
            </NButton>
          </div>
        </div>

        <!-- Step 3: Success -->
        <div v-if="currentStep === 3" class="step-content">
           <div class="icon-wrapper">
            <CheckCircle :size="48" color="#22c55e" />
          </div>
          <h3>All Systems Go!</h3>
          <p>Your organization <strong>{{ orgName }}</strong> has been created. You can now add projects and invite members.</p>
          <div class="actions">
            <NButton type="primary" size="large" @click="finish">
              Go to Dashboard
            </NButton>
          </div>
        </div>
      </div>
    </NCard>
  </NModal>
</template>

<style scoped>
.header {
  text-align: center;
  margin-bottom: 32px;
}
.header h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}
.header p {
  color: var(--text-muted);
}
.steps-container {
  margin-bottom: 40px;
  padding: 0 24px;
}
.step-content {
  text-align: center;
  animation: fadeIn 0.3s ease;
}
.icon-wrapper {
  background: var(--bg-color);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  border: 1px solid var(--border-color);
}
.form-wrapper {
  max-width: 320px;
  margin: 24px auto;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
