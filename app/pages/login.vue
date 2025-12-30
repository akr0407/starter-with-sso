<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, NGradientText, NAlert, NText, NDivider, useMessage } from 'naive-ui'

definePageMeta({
  layout: false,
})

const message = useMessage()
const { login, ssoLogin } = useAuth()
const router = useRouter()
const route = useRoute()

const formRef = ref()
const loading = ref(false)
const ssoLoading = ref(false)
const formData = reactive({
  email: '',
  password: '',
})

const rules = {
  email: { required: true, message: 'Please enter email', trigger: 'blur' },
  password: { required: true, message: 'Please enter password', trigger: 'blur' },
}

// Demo credentials from seeder
const demoCredentials = [
  { label: 'Superadmin', email: 'superadmin@example.com', password: 'superadmin123' },
  { label: 'Admin', email: 'admin1@example.com', password: 'admin123' },
]

function fillCredentials(email: string, password: string) {
  formData.email = email
  formData.password = password
}

async function handleSSOLogin() {
  ssoLoading.value = true
  try {
    const redirect = route.query.redirect as string
    await ssoLogin(redirect)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'SSO login failed'
    message.error(errorMessage)
    ssoLoading.value = false
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  
  loading.value = true
  try {
    await login(formData.email, formData.password)
    message.success('Login successful!')
    router.push('/dashboard')
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    message.error(err?.data?.message || 'Login failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <NCard class="auth-card">
      <template #header>
        <div class="text-center">
          <NGradientText type="success" style="font-size: 1.5rem; font-weight: 700;">
            Welcome Back
          </NGradientText>
          <p style="color: #888; margin-top: 8px;">Sign in to your account</p>
        </div>
      </template>
      
      <!-- SSO Login Button -->
      <NButton 
        block 
        strong
        secondary
        :loading="ssoLoading"
        @click="handleSSOLogin"
        style="margin-bottom: 16px;"
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
        </template>
        Login dengan SSO
      </NButton>

      <NDivider style="margin: 12px 0;">
        <NText depth="3" style="font-size: 12px;">atau login dengan email</NText>
      </NDivider>

      <NForm ref="formRef" :model="formData" :rules="rules">
        <NFormItem path="email" label="Email">
          <NInput v-model:value="formData.email" placeholder="you@example.com" />
        </NFormItem>
        
        <NFormItem path="password" label="Password">
          <NInput 
            v-model:value="formData.password" 
            type="password" 
            placeholder="••••••••"
            show-password-on="click"
            @keyup.enter="handleSubmit"
          />
        </NFormItem>
        
        <NButton 
          type="primary" 
          block 
          :loading="loading"
          @click="handleSubmit"
        >
          Sign In
        </NButton>
      </NForm>
      
      <!-- Demo Credentials -->
      <NAlert title="Demo Credentials" type="info" class="mt-4" :bordered="false">
        <div class="demo-creds">
          <div 
            v-for="cred in demoCredentials" 
            :key="cred.email"
            class="demo-cred-item"
            @click="fillCredentials(cred.email, cred.password)"
          >
            <NText strong>{{ cred.label }}:</NText>
            <NText code>{{ cred.email }}</NText>
            <NText depth="3">/ {{ cred.password }}</NText>
          </div>
        </div>
        <NText depth="3" style="font-size: 12px; display: block; margin-top: 8px;">
          Click to auto-fill • Run <code>npm run db:seed</code> first
        </NText>
      </NAlert>
      
      <NSpace justify="center" class="mt-4">
        <span style="color: #888;">Don't have an account?</span>
        <NuxtLink to="/register" style="color: #10b981;">Register</NuxtLink>
      </NSpace>
      
      <NSpace justify="center" class="mt-4">
        <NuxtLink to="/" style="color: #666; font-size: 0.875rem;">← Back to Home</NuxtLink>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.text-center {
  text-align: center;
}

.mt-4 {
  margin-top: 16px;
}

.demo-creds {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-cred-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.demo-cred-item:hover {
  background: rgba(16, 185, 129, 0.15);
}
</style>
