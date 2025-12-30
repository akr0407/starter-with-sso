<script setup lang="ts">
definePageMeta({
  layout: false,
})

const swaggerLoaded = ref(false)

onMounted(async () => {
  // Load Swagger UI CSS
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css'
  document.head.appendChild(link)

  // Load Swagger UI JS
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js'
  script.onload = () => {
    // @ts-ignore
    window.SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      presets: [
        // @ts-ignore
        window.SwaggerUIBundle.presets.apis,
        // @ts-ignore
        window.SwaggerUIBundle.SwaggerUIStandalonePreset,
      ],
      layout: 'BaseLayout',
      deepLinking: true,
      defaultModelsExpandDepth: -1,
    })
    swaggerLoaded.value = true
  }
  document.body.appendChild(script)
})
</script>

<template>
  <ClientOnly>
    <div class="swagger-page">
      <div class="swagger-header">
        <NuxtLink to="/" class="back-link">← Back to Home</NuxtLink>
        <h1>API Documentation</h1>
      </div>
      <div v-if="!swaggerLoaded" class="loading">Loading Swagger UI...</div>
      <div id="swagger-ui"></div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.swagger-page {
  min-height: 100vh;
  background: #fafafa;
}

.swagger-header {
  background: #1a1a1a;
  color: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.swagger-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.back-link {
  color: #10b981;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.loading {
  padding: 48px;
  text-align: center;
  color: #666;
}

#swagger-ui {
  padding: 24px;
}
</style>
