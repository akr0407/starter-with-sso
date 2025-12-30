<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, NGradientText, useMessage } from 'naive-ui'

definePageMeta({
  layout: false,
})

const message = useMessage()
const { register } = useAuth()
const router = useRouter()

const formRef = ref()
const loading = ref(false)
const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules = {
  firstName: { required: true, message: 'Please enter first name', trigger: 'blur' },
  lastName: { required: true, message: 'Please enter last name', trigger: 'blur' },
  email: [
    { required: true, message: 'Please enter email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please enter password', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' },
  ],
  confirmPassword: {
    required: true,
    validator: (_rule: any, value: string) => {
      if (value !== formData.password) {
        return new Error('Passwords do not match')
      }
      return true
    },
    trigger: 'blur',
  },
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  
  loading.value = true
  try {
    await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    })
    message.success('Registration successful!')
    router.push('/dashboard')
  } catch (error: any) {
    message.error(error?.data?.message || error?.message || 'Registration failed')
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
            Create Account
          </NGradientText>
          <p style="color: #888; margin-top: 8px;">Get started with your SaaS journey</p>
        </div>
      </template>
      
      <NForm ref="formRef" :model="formData" :rules="rules">
        <NSpace :size="12">
          <NFormItem path="firstName" label="First Name" style="flex: 1;">
            <NInput v-model:value="formData.firstName" placeholder="John" />
          </NFormItem>
          <NFormItem path="lastName" label="Last Name" style="flex: 1;">
            <NInput v-model:value="formData.lastName" placeholder="Doe" />
          </NFormItem>
        </NSpace>
        
        <NFormItem path="email" label="Email">
          <NInput v-model:value="formData.email" placeholder="you@example.com" />
        </NFormItem>
        
        <NFormItem path="password" label="Password">
          <NInput 
            v-model:value="formData.password" 
            type="password" 
            placeholder="••••••••"
            show-password-on="click"
          />
        </NFormItem>
        
        <NFormItem path="confirmPassword" label="Confirm Password">
          <NInput 
            v-model:value="formData.confirmPassword" 
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
          Create Account
        </NButton>
      </NForm>
      
      <NSpace justify="center" class="mt-4">
        <span style="color: #888;">Already have an account?</span>
        <NuxtLink to="/login" style="color: #10b981;">Sign In</NuxtLink>
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
  max-width: 480px;
}

.text-center {
  text-align: center;
}

.mt-4 {
  margin-top: 16px;
}
</style>
