<script setup lang="ts">
import { NCard, NSpace, NSwitch, NIcon, useMessage, NDivider, NButtonGroup, NButton, NSelect } from 'naive-ui'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { themePresets, type ThemePresetKey, type ThemeMode } from '~/utils/theme'

definePageMeta({
    title: 'Settings',
})

const { userPreferences, updatePreferences } = useAuth()
// const { locale, locales, setLocale } = useI18n()
const message = useMessage()
const saving = ref(false)

// Locale options for dropdown
/*
const localeOptions = computed(() => 
  locales.value.map((l: any) => ({
    label: l.name,
    value: l.code,
  }))
)

// Change locale
function changeLocale(code: string) {
  setLocale(code)
  message.success(`Language changed!`)
}
*/

// Get current theme settings
const currentColor = computed(() => 
  userPreferences.value?.theme?.primaryColor || '#6366f1'
)

const currentMode = computed<ThemeMode>(() => 
  userPreferences.value?.theme?.mode || 'dark'
)

// Find current preset key
const currentPreset = computed(() => {
  const color = currentColor.value
  return (Object.keys(themePresets) as ThemePresetKey[]).find(
    key => themePresets[key].primary === color
  ) || 'indigo'
})

// Handle color selection
async function selectTheme(presetKey: ThemePresetKey) {
  if (saving.value) return
  
  saving.value = true
  try {
    await updatePreferences({
      theme: {
        primaryColor: themePresets[presetKey].primary,
        mode: currentMode.value,
      }
    })
    message.success('Theme color updated!')
  } catch (error) {
    message.error('Failed to update theme')
    console.error(error)
  } finally {
    saving.value = false
  }
}

// Handle mode selection
async function selectMode(mode: ThemeMode) {
  if (saving.value || mode === currentMode.value) return
  
  saving.value = true
  try {
    await updatePreferences({
      theme: {
        primaryColor: currentColor.value,
        mode,
      }
    })
    const modeLabel = mode === 'system' ? 'System' : mode.charAt(0).toUpperCase() + mode.slice(1)
    message.success(`Switched to ${modeLabel} mode!`)
  } catch (error) {
    message.error('Failed to update theme mode')
    console.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="settings-page">
    <h1 class="page-title">Settings</h1>
    <p class="page-subtitle">Customize your experience</p>

    <NCard title="Appearance" class="settings-card" :bordered="true">
      <!-- Theme Mode Selector -->
      <p class="section-title">Theme Mode</p>
      <div class="mode-buttons">
        <button 
          class="mode-btn" 
          :class="{ active: currentMode === 'light' }"
          @click="selectMode('light')"
          :disabled="saving"
        >
          <Sun class="mode-icon" />
          <span>Light</span>
        </button>
        <button 
          class="mode-btn" 
          :class="{ active: currentMode === 'dark' }"
          @click="selectMode('dark')"
          :disabled="saving"
        >
          <Moon class="mode-icon" />
          <span>Dark</span>
        </button>
        <button 
          class="mode-btn" 
          :class="{ active: currentMode === 'system' }"
          @click="selectMode('system')"
          :disabled="saving"
        >
          <Monitor class="mode-icon" />
          <span>System</span>
        </button>
      </div>

      <NDivider />

      <!-- Accent Color Selection -->
      <p class="section-title">Accent Color</p>
      <div class="theme-grid">
        <button
          v-for="(preset, key) in themePresets"
          :key="key"
          class="theme-swatch"
          :class="{ 'active': currentPreset === key }"
          :style="{ '--swatch-color': preset.primary }"
          @click="selectTheme(key as ThemePresetKey)"
          :disabled="saving"
        >
          <div class="swatch-inner">
            <span class="swatch-check" v-if="currentPreset === key">✓</span>
          </div>
          <span class="swatch-label">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</span>
        </button>
      </div>

      <NDivider />

      <!-- Live Preview -->
      <p class="section-title">Preview</p>
      <div class="preview-container" :class="currentMode">
        <div class="preview-card">
          <div class="preview-header">
            <div class="preview-avatar" :style="{ backgroundColor: currentColor }">A</div>
            <div class="preview-text">
              <div class="preview-name">Sample User</div>
              <div class="preview-email">user@example.com</div>
            </div>
          </div>
          <div class="preview-content">
            <div class="preview-button" :style="{ backgroundColor: currentColor }">
              Primary Button
            </div>
            <div class="preview-button ghost" :style="{ borderColor: currentColor, color: currentColor }">
              Secondary
            </div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 
    <NCard title="Language" class="settings-card mt-6" :bordered="true">
      <p class="section-title">Select your preferred language</p>
      <NSelect
        :value="'en'"
        :options="[]"
        style="max-width: 300px;"
        disabled
      />
    </NCard>
    -->

    <NCard title="Account" class="settings-card mt-6" :bordered="true">
      <p style="color: var(--text-muted);">More settings coming soon...</p>
    </NCard>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 800px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: var(--text-muted, #a1a1aa);
  margin: 0 0 32px 0;
}

.settings-card {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: var(--text-muted, #a1a1aa);
}

.mode-buttons {
  display: flex;
  gap: 12px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: transparent;
  border: 2px solid var(--border-color, #27272a);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-muted, #a1a1aa);
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--text-muted, #52525b);
}

.mode-btn.active {
  border-color: var(--primary-color, #6366f1);
  color: var(--primary-color, #6366f1);
  background: rgba(99, 102, 241, 0.1);
}

.mode-icon {
  width: 24px;
  height: 24px;
}

.theme-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.theme-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-swatch:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-color, #27272a);
}

.theme-swatch.active {
  border-color: var(--swatch-color);
  background: rgba(255, 255, 255, 0.03);
}

.swatch-inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--swatch-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.theme-swatch:hover .swatch-inner {
  transform: scale(1.1);
}

.swatch-check {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.swatch-label {
  font-size: 12px;
  color: var(--text-muted, #a1a1aa);
  font-weight: 500;
  text-transform: capitalize;
}

/* Preview Section */
.preview-container {
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}

.preview-container.dark {
  background: #18181b;
  color: #f4f4f5;
}

.preview-container.light {
  background: #f4f4f5;
  color: #18181b;
}

.preview-card {
  max-width: 300px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.preview-name {
  font-weight: 600;
}

.preview-email {
  font-size: 12px;
  opacity: 0.6;
}

.preview-content {
  display: flex;
  gap: 12px;
}

.preview-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  border: none;
}

.preview-button.ghost {
  background: transparent;
  border: 1px solid;
}

.mt-6 {
  margin-top: 24px;
}
</style>
