// Theme management for the Pilot Browser

import { state } from './app.js';

/**
 * Initialize theme functionality
 */
export function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Apply saved theme or system preference
    applyTheme(state.preferences.theme);
    
    // Listen for theme toggle button click
    themeToggle.addEventListener('click', toggleTheme);
    
    // Listen for system theme changes
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDarkScheme.addEventListener('change', handleSystemThemeChange);
    
    // Update the theme toggle icon
    updateThemeIcon(state.preferences.theme);
}

/**
 * Toggle between light, dark, and system themes
 */
function toggleTheme() {
    const currentTheme = state.preferences.theme;
    let newTheme;
    
    // Cycle through themes: system -> light -> dark -> system
    if (currentTheme === 'system') {
        newTheme = 'light';
    } else if (currentTheme === 'light') {
        newTheme = 'dark';
    } else {
        newTheme = 'system';
    }
    
    // Update preferences and apply the new theme
    state.preferences.theme = newTheme;
    applyTheme(newTheme);
    updateThemeIcon(newTheme);
    
    // Save preferences
    localStorage.setItem('theme', newTheme);
    
    // Notify other components about theme change
    document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: newTheme }
    }));
}

/**
 * Apply the specified theme
 * @param {string} theme - The theme to apply ('light', 'dark', or 'system')
 */
function applyTheme(theme) {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Remove any existing theme attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-source');
    
    if (theme === 'system') {
        // Apply system preference
        const systemTheme = isSystemDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        document.documentElement.setAttribute('data-theme-source', 'system');
    } else {
        // Apply user-selected theme
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-theme-source', 'user');
    }
    
    // Update state
    state.preferences.theme = theme;
    
    // Save to preferences
    if (window.savePreferences) {
        window.savePreferences();
    }
}

/**
 * Handle system theme changes when in 'system' mode
 * @param {MediaQueryListEvent} e - The media query event
 */
function handleSystemThemeChange(e) {
    if (state.preferences.theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Notify other components about theme change
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: 'system', effectiveTheme: newTheme }
        }));
    }
}

/**
 * Update the theme toggle icon based on the current theme
 * @param {string} theme - The current theme
 */
function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    if (!icon) return;
    
    switch (theme) {
        case 'dark':
            icon.className = 'fas fa-sun';
            themeToggle.setAttribute('title', 'Switch to system theme');
            break;
        case 'light':
            icon.className = 'fas fa-moon';
            themeToggle.setAttribute('title', 'Switch to dark theme');
            break;
        default: // system
            icon.className = 'fas fa-desktop';
            themeToggle.setAttribute('title', 'Switch to light theme');
            break;
    }
}

/**
 * Get the current effective theme (resolves 'system' to actual theme)
 * @returns {string} The current effective theme ('light' or 'dark')
 */
export function getEffectiveTheme() {
    if (state.preferences.theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.preferences.theme;
}

/**
 * Add a CSS class to an element based on the current theme
 * @param {HTMLElement} element - The element to add the class to
 * @param {string} lightClass - The class to add in light mode
 * @param {string} darkClass - The class to add in dark mode
 */
export function applyThemeClass(element, lightClass, darkClass) {
    if (!element) return;
    
    const updateClasses = () => {
        const isDark = getEffectiveTheme() === 'dark';
        element.classList.toggle(lightClass, !isDark);
        element.classList.toggle(darkClass, isDark);
    };
    
    // Apply initial classes
    updateClasses();
    
    // Update classes when theme changes
    document.addEventListener('themeChanged', updateClasses);
}
