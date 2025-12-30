// User preferences type - shared between client and server
export interface UserPreferences {
    theme?: {
        primaryColor?: string // e.g., '#6366f1'
        mode?: 'dark' | 'light'
    }
}
