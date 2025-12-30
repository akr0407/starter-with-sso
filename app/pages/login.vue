<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, NGradientText, NAlert, NText, useMessage } from 'naive-ui'

definePageMeta({
  layout: false,
})

const message = useMessage()
const { login } = useAuth()
const router = useRouter()

const formRef = ref()
const loading = ref(false)
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
  } catch (error: any) {
    message.error(error?.data?.message || 'Login failed')
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
