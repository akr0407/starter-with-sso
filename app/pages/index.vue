<script setup lang="ts">
import { NButton, NCard, NSpace, NStatistic, NGradientText, NGrid, NGridItem, NIcon } from 'naive-ui'
import { Rocket, ShieldCheck, FileText, Box } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const features = [
  { 
    icon: Rocket, 
    title: 'Nuxt 4 Ready', 
    desc: 'Built on the latest Nuxt 4 with the new app/ directory structure' 
  },
  { 
    icon: ShieldCheck, 
    title: 'JWT Authentication', 
    desc: 'Secure auth with refresh tokens and superadmin impersonation' 
  },
  { 
    icon: FileText, 
    title: 'OpenAPI Docs', 
    desc: 'Auto-generated Swagger UI documentation for all API endpoints' 
  },
  { 
    icon: Box, 
    title: 'Drizzle ORM', 
    desc: 'Type-safe database with PostgreSQL and comprehensive audit logging' 
  },
]
</script>

<template>
  <div class="landing-page">
    <div class="hero">
      <NGradientText type="success" class="hero-title">
        SaaS Starter Kit
      </NGradientText>
      <p class="hero-subtitle">
        A production-ready boilerplate with Nuxt 4, Naive UI, Drizzle ORM, and PostgreSQL
      </p>
      
      <NSpace justify="center" class="mt-8">
        <NButton type="primary" size="large" @click="navigateTo('/register')">
          Get Started
        </NButton>
        <NButton size="large" ghost @click="navigateTo('/login')">
          Sign In
        </NButton>
      </NSpace>
      
      <NSpace justify="center" class="mt-4">
        <NButton text tag="a" href="/api-docs" target="_blank">
          📚 View API Documentation
        </NButton>
      </NSpace>
    </div>
    
    <div class="features">
      <NGrid x-gap="24" y-gap="24" cols="1 m:2 l:4">
        <NGridItem v-for="feature in features" :key="feature.title">
          <NCard hoverable style="height: 100%;">
            <template #header>
              <NSpace align="center">
                <NIcon :component="feature.icon" size="24" color="#10b981" />
                <span>{{ feature.title }}</span>
              </NSpace>
            </template>
            <p style="color: #a0a0a0;">{{ feature.desc }}</p>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>
    
    <footer class="footer">
      <p>Built with ❤️ using Nuxt 4 + Naive UI + Drizzle ORM</p>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 80px 24px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 60px 0;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #888;
  max-width: 600px;
  margin: 0 auto;
}

.features {
  margin-top: 60px;
}

.mt-8 {
  margin-top: 32px;
}

.mt-4 {
  margin-top: 16px;
}

.footer {
  margin-top: auto;
  padding: 40px 0;
  text-align: center;
  color: #666;
}
</style>
