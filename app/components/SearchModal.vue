<script setup lang="ts">
import { NModal, NInput, NEmpty, NSpin, NIcon } from 'naive-ui'
import { Search, Building2, Folder, ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const router = useRouter()
const api = useApi()

const searchQuery = ref('')
const loading = ref(false)
const results = ref<{
  organizations: any[]
  projects: any[]
}>({ organizations: [], projects: [] })

const selectedIndex = ref(0)

// Flatten results for keyboard navigation
const flatResults = computed(() => [
  ...results.value.organizations,
  ...results.value.projects,
])

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

watch(searchQuery, (query) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (query.length < 2) {
    results.value = { organizations: [], projects: [] }
    return
  }
  
  searchTimeout = setTimeout(() => {
    performSearch(query)
  }, 300)
})

async function performSearch(query: string) {
  loading.value = true
  try {
    const res = await api.get<{ results: typeof results.value }>('/search', { q: query })
    results.value = res.results
    selectedIndex.value = 0
  } catch (e) {
    console.error('Search failed', e)
  } finally {
    loading.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  const total = flatResults.value.length
  
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % total
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + total) % total
  } else if (e.key === 'Enter' && flatResults.value.length > 0) {
    e.preventDefault()
    navigateToResult(flatResults.value[selectedIndex.value])
  }
}

function navigateToResult(result: any) {
  emit('update:show', false)
  searchQuery.value = ''
  results.value = { organizations: [], projects: [] }
  router.push(result.url)
}

function close() {
  emit('update:show', false)
  searchQuery.value = ''
  results.value = { organizations: [], projects: [] }
}

// Reset on open
watch(() => props.show, (show) => {
  if (show) {
    searchQuery.value = ''
    results.value = { organizations: [], projects: [] }
    selectedIndex.value = 0
  }
})
</script>

<template>
  <NModal
    :show="show"
    @update:show="emit('update:show', $event)"
    preset="card"
    style="width: 500px; max-width: 90vw;"
    :bordered="false"
    size="small"
    :closable="false"
    @keydown="handleKeydown"
  >
    <div class="search-modal">
      <div class="search-input-wrapper">
        <NIcon :component="Search" size="20" class="search-icon" />
        <input
          v-model="searchQuery"
          placeholder="Search organizations, projects..."
          class="search-input"
          autofocus
          @keydown.esc="close"
        />
        <kbd class="kbd">ESC</kbd>
      </div>
      
      <div class="search-results" v-if="searchQuery.length >= 2">
        <NSpin v-if="loading" size="small" class="spinner" />
        
        <template v-else-if="flatResults.length > 0">
          <!-- Organizations -->
          <div v-if="results.organizations.length > 0" class="result-section">
            <p class="section-label">Organizations</p>
            <div
              v-for="(org, i) in results.organizations"
              :key="org.id"
              class="result-item"
              :class="{ selected: selectedIndex === i }"
              @click="navigateToResult(org)"
              @mouseenter="selectedIndex = i"
            >
              <NIcon :component="Building2" size="18" class="result-icon" />
              <div class="result-content">
                <span class="result-name">{{ org.name }}</span>
                <span class="result-slug">{{ org.slug }}</span>
              </div>
              <NIcon :component="ArrowRight" size="16" class="arrow" />
            </div>
          </div>
          
          <!-- Projects -->
          <div v-if="results.projects.length > 0" class="result-section">
            <p class="section-label">Projects</p>
            <div
              v-for="(proj, i) in results.projects"
              :key="proj.id"
              class="result-item"
              :class="{ selected: selectedIndex === results.organizations.length + i }"
              @click="navigateToResult(proj)"
              @mouseenter="selectedIndex = results.organizations.length + i"
            >
              <NIcon :component="Folder" size="18" class="result-icon" />
              <div class="result-content">
                <span class="result-name">{{ proj.name }}</span>
                <span class="result-status">{{ proj.status }}</span>
              </div>
              <NIcon :component="ArrowRight" size="16" class="arrow" />
            </div>
          </div>
        </template>
        
        <NEmpty v-else description="No results found" size="small" class="empty" />
      </div>
      
      <div class="search-footer">
        <span><kbd>↑↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Select</span>
        <span><kbd>ESC</kbd> Close</span>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.search-modal {
  margin: -16px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #27272a);
}

.search-icon {
  color: var(--text-muted, #a1a1aa);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--text-color, #f4f4f5);
}

.search-input::placeholder {
  color: var(--text-muted, #a1a1aa);
}

.kbd {
  background: var(--border-color, #27272a);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-muted, #a1a1aa);
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.spinner {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.result-section {
  margin-bottom: 8px;
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted, #a1a1aa);
  padding: 8px 12px 4px;
  margin: 0;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.result-item:hover,
.result-item.selected {
  background: var(--primary-color, #6366f1);
}

.result-item.selected .result-name,
.result-item.selected .result-icon {
  color: white;
}

.result-icon {
  color: var(--text-muted, #a1a1aa);
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.result-name {
  font-size: 14px;
  color: var(--text-color, #f4f4f5);
}

.result-slug,
.result-status {
  font-size: 12px;
  color: var(--text-muted, #a1a1aa);
}

.arrow {
  color: var(--text-muted, #52525b);
  opacity: 0;
  transition: opacity 0.15s;
}

.result-item:hover .arrow,
.result-item.selected .arrow {
  opacity: 1;
  color: white;
}

.empty {
  padding: 24px;
}

.search-footer {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color, #27272a);
  font-size: 12px;
  color: var(--text-muted, #a1a1aa);
}

.search-footer kbd {
  margin-right: 4px;
}
</style>
