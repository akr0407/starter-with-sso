<script setup lang="ts">
definePageMeta({
  layout: false,
  ssr: false, // Disable SSR - sessionStorage only available on client
})

const route = useRoute()
const { handleSSOCallback } = useAuth()
const message = ref('Memproses login...')
const isClient = ref(false)

onMounted(async () => {
  isClient.value = true
  
  // Small delay to ensure hydration is complete
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const code = route.query.code as string
  const state = route.query.state as string
  const error = route.query.error as string

  if (error) {
    message.value = 'Login gagal: ' + (route.query.error_description || error)
    setTimeout(() => {
      navigateTo('/login')
    }, 3000)
    return
  }

  if (!code || !state) {
    message.value = 'Invalid callback parameters'
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
    return
  }

  try {
    await handleSSOCallback(code, state)
    message.value = 'Login berhasil! Redirecting...'
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Callback error:', err)
    message.value = 'Login gagal: ' + errorMessage
    setTimeout(() => {
      navigateTo('/login')
    }, 3000)
  }
})
</script>

<template>
  <div class="callback-page">
    <div class="callback-container">
      <div class="spinner" />
      <p class="message">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.callback-container {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message {
  color: #a1a1aa;
  font-size: 1rem;
}
</style>
