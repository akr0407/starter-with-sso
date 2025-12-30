import { Home, Building2, Folder, Users, FileText, Settings } from 'lucide-vue-next'
import type { Component } from 'vue'

export interface NavItem {
    label: string
    path: string
    icon: Component
    adminOnly?: boolean
    superadminOnly?: boolean
}

export interface NavDivider {
    type: 'divider'
    key: string
}

export type NavMenuItem = NavItem | NavDivider

// Main navigation items (visible to all users)
export const mainNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Organizations', path: '/dashboard/organizations', icon: Building2 },
    { label: 'Projects', path: '/dashboard/projects', icon: Folder },
]

// Admin-only navigation items
export const adminNavItems: NavItem[] = [
    { label: 'Users', path: '/admin/users', icon: Users, adminOnly: true },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText, adminOnly: true },
]

// Bottom navigation items (visible to all)
export const bottomNavItems: NavItem[] = [
    { label: 'Settings', path: '/settings', icon: Settings },
]

// User dropdown menu options
export const userMenuOptions = [
    { label: 'Profile', key: 'profile' },
    { label: 'Settings', key: 'settings' },
    { type: 'divider', key: 'd1' },
    { label: 'Logout', key: 'logout' },
]
