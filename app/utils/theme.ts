import { type GlobalThemeOverrides } from 'naive-ui'

// Available theme presets
export const themePresets = {
    indigo: { primary: '#6366f1', hover: '#818cf8', pressed: '#4f46e5' },
    emerald: { primary: '#10b981', hover: '#34d399', pressed: '#059669' },
    rose: { primary: '#f43f5e', hover: '#fb7185', pressed: '#e11d48' },
    amber: { primary: '#f59e0b', hover: '#fbbf24', pressed: '#d97706' },
    cyan: { primary: '#06b6d4', hover: '#22d3ee', pressed: '#0891b2' },
    violet: { primary: '#8b5cf6', hover: '#a78bfa', pressed: '#7c3aed' },
} as const

export type ThemePresetKey = keyof typeof themePresets
export type ThemeMode = 'dark' | 'light' | 'system'

// Color schemes for dark and light modes
const darkColors = {
    baseColor: '#09090b',
    cardColor: '#18181b',
    textColor1: '#f4f4f5',
    textColor2: '#a1a1aa',
    borderColor: '#27272a',
    siderColor: '#09090b',
}

const lightColors = {
    baseColor: '#ffffff',
    cardColor: '#f4f4f5',
    textColor1: '#18181b',
    textColor2: '#52525b',
    borderColor: '#e4e4e7',
    siderColor: '#fafafa',
}

// Helper to get RGBA with opacity from hex
function hexToRgba(hex: string, opacity: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Create theme overrides based on primary color and mode
export function createThemeOverrides(
    primaryColor: string = '#6366f1',
    mode: ThemeMode = 'dark'
): GlobalThemeOverrides {
    const preset = Object.values(themePresets).find(p => p.primary === primaryColor)
    const colors = preset || {
        primary: primaryColor,
        hover: primaryColor,
        pressed: primaryColor,
    }

    const modeColors = mode === 'dark' ? darkColors : lightColors

    return {
        common: {
            primaryColor: colors.primary,
            primaryColorHover: colors.hover,
            primaryColorPressed: colors.pressed,
            primaryColorSuppl: colors.pressed,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            borderRadius: '8px',
            baseColor: modeColors.baseColor,
            cardColor: modeColors.cardColor,
            modalColor: modeColors.cardColor,
            popoverColor: modeColors.cardColor,
            textColorBase: modeColors.textColor1,
            textColor1: modeColors.textColor1,
            textColor2: modeColors.textColor2,
            borderColor: modeColors.borderColor,
        },
        Layout: {
            siderColor: modeColors.siderColor,
            headerColor: modeColors.siderColor,
            footerColor: modeColors.siderColor,
            color: modeColors.baseColor,
        },
        Card: {
            borderRadius: '12px',
            color: modeColors.cardColor,
            borderColor: modeColors.borderColor,
        },
        Button: {
            borderRadiusMedium: '6px',
            fontWeight: '500',
        },
        Menu: {
            itemColorActive: hexToRgba(colors.primary, 0.15),
            itemColorActiveHover: hexToRgba(colors.primary, 0.2),
            itemColorHover: modeColors.borderColor,
            itemTextColorActive: colors.hover,
            itemTextColorActiveHover: colors.hover,
            itemIconColorActive: colors.hover,
            itemIconColorActiveHover: colors.hover,
            borderRadius: '6px',
        },
    }
}

// Helper to get RGB string from hex
function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
}

// Get CSS variables for a given mode (for non-Naive UI elements)
export function getThemeCssVars(primaryColor: string = '#6366f1', mode: ThemeMode = 'dark') {
    const modeColors = mode === 'dark' ? darkColors : lightColors
    return {
        '--bg-color': modeColors.baseColor,
        '--sidebar-bg': modeColors.siderColor,
        '--sidebar-rgb': hexToRgb(modeColors.siderColor),
        '--card-color': modeColors.cardColor,
        '--border-color': modeColors.borderColor,
        '--border-rgb': hexToRgb(modeColors.borderColor),
        '--text-color': modeColors.textColor1,
        '--text-muted': modeColors.textColor2,
        '--primary-color': primaryColor,
    }
}

// Default export for backward compatibility
export const themeOverrides = createThemeOverrides()
