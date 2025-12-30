<script setup lang="ts">
import { NButton } from 'naive-ui'

defineProps<{
  title?: string
  description?: string
  showAction?: boolean
  actionLabel?: string
}>()

defineEmits(['action'])
</script>

<template>
  <div class="empty-state">
    <div class="illustration">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="60" fill="rgba(161, 161, 170, 0.05)"/>
        <circle cx="60" cy="60" r="45" stroke="rgba(161, 161, 170, 0.1)" stroke-width="1" stroke-dasharray="4 4"/>
        <rect x="42" y="42" width="36" height="36" rx="8" fill="rgba(99, 102, 241, 0.1)" stroke="#6366f1" stroke-width="2"/>
        <path d="M60 52V68" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
        <path d="M52 60H68" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <h3 v-if="title" class="title">{{ title }}</h3>
    <p v-if="description" class="description">{{ description }}</p>
    <div v-if="showAction || $slots.action" class="actions">
      <slot name="action">
         <NButton v-if="showAction" type="primary" @click="$emit('action')">{{ actionLabel }}</NButton>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}
.illustration {
  margin-bottom: 24px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #f4f4f5;
}
.description {
  font-size: 14px;
  color: #a1a1aa;
  margin: 0 0 24px 0;
  max-width: 400px;
  line-height: 1.5;
}
</style>
