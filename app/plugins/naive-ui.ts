import { setup } from '@css-render/vue3-ssr'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
    // Setup SSR for Naive UI
    if (import.meta.server && nuxtApp.ssrContext) {
        const { collect } = setup(nuxtApp.vueApp)
        const originalRenderMeta = nuxtApp.ssrContext.renderMeta

        nuxtApp.ssrContext.renderMeta = () => {
            if (!originalRenderMeta) {
                return { headTags: collect() }
            }
            const collectedMeta = typeof originalRenderMeta === 'function' ? originalRenderMeta() : {}
            return {
                ...collectedMeta,
                headTags: ((collectedMeta as any).headTags || '') + collect(),
            }
        }
    }
})
