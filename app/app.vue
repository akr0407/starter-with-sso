<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, darkTheme, lightTheme } from 'naive-ui'
import { createThemeOverrides, getThemeCssVars, type ThemeMode } from '~/utils/theme'
import '~/assets/css/main.css'

// Get user preferences from auth
const { userPreferences } = useAuth()

// Track system preference
const systemPrefersDark = ref(true)

// Listen for system theme changes
onMounted(() => {
  if (import.meta.client) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mediaQuery.matches
    
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches
    })
  }
})

// Get user's theme mode preference
const userThemeMode = computed<ThemeMode | 'system'>(() => 
  userPreferences.value?.theme?.mode || 'dark'
)

// Resolve actual theme (handles 'system' preference)
const effectiveThemeMode = computed<'dark' | 'light'>(() => {
  if (userThemeMode.value === 'system') {
    return systemPrefersDark.value ? 'dark' : 'light'
  }
  return userThemeMode.value as 'dark' | 'light'
})

// Naive UI theme (dark or light)
const naiveTheme = computed(() => 
  effectiveThemeMode.value === 'dark' ? darkTheme : lightTheme
)

// Get primary color
const primaryColor = computed(() => 
  userPreferences.value?.theme?.primaryColor || '#6366f1'
)

// Reactive theme overrides based on user preference
const computedThemeOverrides = computed(() => 
  createThemeOverrides(primaryColor.value, effectiveThemeMode.value)
)

// Apply CSS vars to document root for non-Naive UI elements
watchEffect(() => {
  if (import.meta.client) {
    const vars = getThemeCssVars(primaryColor.value, effectiveThemeMode.value)
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  }
})
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="computedThemeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </NNotificationProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
/* Scoped styles removed - using global CSS */
</style>
