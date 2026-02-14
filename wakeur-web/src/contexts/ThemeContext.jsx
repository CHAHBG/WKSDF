/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'wakeur_theme';
const PALETTE_STORAGE_KEY = 'wakeur_palette';

export const PALETTES = {
    default: {
        name: 'Wakeur (Défaut)',
        colors: {
            light: { primary: '#0f172a', primaryLight: '#1e293b', accent: '#f97316' },
            dark: { primary: '#f8fafc', primaryLight: '#e2e8f0', accent: '#fb923c' }
        }
    },
    ocean: {
        name: 'Océan Profond',
        colors: {
            light: { primary: '#0e7490', primaryLight: '#155e75', accent: '#06b6d4' },
            dark: { primary: '#a5f3fc', primaryLight: '#cffafe', accent: '#22d3ee' }
        }
    },
    royal: {
        name: 'Améthyste Royale',
        colors: {
            light: { primary: '#7e22ce', primaryLight: '#6b21a8', accent: '#d946ef' },
            dark: { primary: '#e9d5ff', primaryLight: '#f3e8ff', accent: '#e879f9' }
        }
    },
    forest: {
        name: 'Forêt Émeraude',
        colors: {
            light: { primary: '#15803d', primaryLight: '#166534', accent: '#84cc16' },
            dark: { primary: '#bbf7d0', primaryLight: '#dcfce7', accent: '#a3e635' }
        }
    },
    ruby: {
        name: 'Rubis Intense',
        colors: {
            light: { primary: '#be123c', primaryLight: '#9f1239', accent: '#fb7185' },
            dark: { primary: '#fecdd3', primaryLight: '#ffe4e6', accent: '#fda4af' }
        }
    },
    sunset: {
        name: 'Coucher de Soleil',
        colors: {
            light: { primary: '#c2410c', primaryLight: '#9a3412', accent: '#f59e0b' },
            dark: { primary: '#fed7aa', primaryLight: '#ffedd5', accent: '#fbbf24' }
        }
    },
    lavender: {
        name: 'Lavande Douce',
        colors: {
            light: { primary: '#6366f1', primaryLight: '#4f46e5', accent: '#818cf8' },
            dark: { primary: '#c7d2fe', primaryLight: '#e0e7ff', accent: '#a5b4fc' }
        }
    },
    coffee: {
        name: 'Espresso',
        colors: {
            light: { primary: '#451a03', primaryLight: '#78350f', accent: '#d97706' },
            dark: { primary: '#ebd5c1', primaryLight: '#f5ebe0', accent: '#f59e0b' }
        }
    },
    slate: {
        name: 'Ardoise Minimal',
        colors: {
            light: { primary: '#334155', primaryLight: '#475569', accent: '#94a3b8' },
            dark: { primary: '#cbd5e1', primaryLight: '#e2e8f0', accent: '#64748b' }
        }
    },
    midnight: {
        name: 'Minuit',
        colors: {
            light: { primary: '#1e1b4b', primaryLight: '#312e81', accent: '#6366f1' },
            dark: { primary: '#e0e7ff', primaryLight: '#eef2ff', accent: '#818cf8' }
        }
    }
};

const ThemeContext = createContext(undefined);

const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
};

const getInitialPalette = () => {
    if (typeof window === 'undefined') return 'default';
    return window.localStorage.getItem(PALETTE_STORAGE_KEY) || 'default';
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);
    const [currentPalette, setCurrentPalette] = useState(getInitialPalette);

    useEffect(() => {
        const html = document.documentElement;
        html.classList.toggle('dark', theme === 'dark');
        html.setAttribute('data-theme', theme);
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    // Dynamic CSS Injection
    useEffect(() => {
        const palette = PALETTES[currentPalette] || PALETTES.default;
        const styleId = 'theme-overrides';
        let styleTag = document.getElementById(styleId);

        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        const css = `
            :root {
                --primary: ${palette.colors.light.primary};
                --primary-light: ${palette.colors.light.primaryLight};
                --accent: ${palette.colors.light.accent};
            }
            html.dark {
                --primary: ${palette.colors.dark.primary};
                --primary-light: ${palette.colors.dark.primaryLight};
                --accent: ${palette.colors.dark.accent};
            }
        `;

        styleTag.innerHTML = css;
        window.localStorage.setItem(PALETTE_STORAGE_KEY, currentPalette);
    }, [currentPalette]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const value = useMemo(() => ({
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        currentPalette,
        setCurrentPalette,
        palettes: PALETTES
    }), [theme, currentPalette]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used inside ThemeProvider');
    }
    return context;
};
