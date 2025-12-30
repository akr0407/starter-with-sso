<script setup lang="ts">
import { NCard, NEmpty, NSkeleton, NSpace, NIcon, NTime } from 'naive-ui'
import { Plus, Pencil, Trash2, Eye, Activity } from 'lucide-vue-next'

const api = useApi()
const loading = ref(true)
const activities = ref<any[]>([])

const actionIcons: Record<string, any> = {
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  VIEW: Eye,
}

const actionColors: Record<string, string> = {
  INSERT: '#10b981',
  UPDATE: '#f59e0b',
  DELETE: '#ef4444',
  VIEW: '#6366f1',
}

async function fetchActivity() {
  loading.value = true
  try {
    const res = await api.get<{ activities: any[] }>('/users/activity', { limit: 10 })
    activities.value = res.activities || []
  } catch (e) {
    console.error('Failed to fetch activity', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchActivity)
</script>

<template>
  <NCard title="Recent Activity" :bordered="true" class="activity-card">
    <template #header-extra>
      <NIcon :component="Activity" size="18" color="#a1a1aa" />
    </template>

    <div v-if="loading" class="activity-loading">
      <NSkeleton v-for="i in 5" :key="i" text :repeat="2" style="margin-bottom: 16px;" />
    </div>

    <NEmpty v-else-if="activities.length === 0" description="No recent activity" />

    <div v-else class="activity-list">
      <div 
        v-for="activity in activities" 
        :key="activity.id" 
        class="activity-item"
      >
        <div 
          class="activity-icon" 
          :style="{ backgroundColor: actionColors[activity.action] + '20', color: actionColors[activity.action] }"
        >
          <component :is="actionIcons[activity.action] || Activity" class="icon" />
        </div>
        <div class="activity-content">
          <p class="activity-description">{{ activity.description }}</p>
          <span class="activity-time">
            <NTime :time="new Date(activity.createdAt)" type="relative" />
          </span>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.activity-card {
  height: 100%;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon .icon {
  width: 18px;
  height: 18px;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-description {
  margin: 0;
  font-size: 14px;
  color: var(--text-color, #f4f4f5);
}

.activity-time {
  font-size: 12px;
  color: var(--text-muted, #a1a1aa);
}

.activity-loading {
  padding: 8px 0;
}
</style>
