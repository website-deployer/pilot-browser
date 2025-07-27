// Application initialization and core functionality

// Import modules
import { initTheme } from './theme.js';
import { initSidebar } from './sidebar.js';
import { initSearch } from './search.js';
import { initModals } from './modals.js';
import { initQuickActions } from './quick-actions.js';
import { checkConnectionStatus, setupIpcHandlers } from './ipc.js';

// Global state
const state = {
    isInitialized: false,
    user: null,
    preferences: {},
    searchHistory: [],
    currentSearch: null
};

/**
 * Initialize the application
 */
export async function initApp() {
    if (state.isInitialized) return;
    
    console.log('Initializing Pilot Browser...');
    
    try {
        // Initialize UI components
        initTheme();
        initSidebar();
        initSearch();
        initModals();
        initQuickActions();
        
        // Initialize IPC communication
        setupIpcHandlers();
        
        // Load user data and preferences
        await loadUserData();
        
        // Update UI based on loaded data
        updateUI();
        
        // Set up periodic updates
        setupPeriodicUpdates();
        
        state.isInitialized = true;
        console.log('Pilot Browser initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Failed to initialize application. Please try refreshing the page.');
    }
}

/**
 * Load user data and preferences
 */
async function loadUserData() {
    try {
        // In a real app, this would load from localStorage or an API
        const savedTheme = localStorage.getItem('theme') || 'system';
        const savedPreferences = JSON.parse(localStorage.getItem('preferences') || '{}');
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        // Apply loaded data to state
        state.preferences = {
            theme: savedTheme,
            searchEngine: savedPreferences.searchEngine || 'google',
            safeSearch: savedPreferences.safeSearch !== false,
            aiModel: savedPreferences.aiModel || 'gpt-4',
            autoAIMode: savedPreferences.autoAIMode !== false,
            ...savedPreferences
        };
        
        state.searchHistory = searchHistory;
        
        // Apply theme immediately
        document.documentElement.setAttribute('data-theme', 
            savedTheme === 'system' 
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : savedTheme
        );
        
    } catch (error) {
        console.error('Error loading user data:', error);
        // Reset to defaults on error
        state.preferences = {
            theme: 'system',
            searchEngine: 'google',
            safeSearch: true,
            aiModel: 'gpt-4',
            autoAIMode: true
        };
        state.searchHistory = [];
    }
}

/**
 * Save user preferences
 */
function savePreferences() {
    try {
        localStorage.setItem('preferences', JSON.stringify(state.preferences));
        localStorage.setItem('theme', state.preferences.theme);
        
        // Notify other components about preference changes
        document.dispatchEvent(new CustomEvent('preferencesUpdated', {
            detail: { ...state.preferences }
        }));
        
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
}

/**
 * Update UI based on application state
 */
function updateUI() {
    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (state.preferences.theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else if (state.preferences.theme === 'light') {
            icon.className = 'fas fa-moon';
        } else {
            icon.className = 'fas fa-desktop';
        }
    }
    
    // Update other UI elements based on preferences
    // ...
}

/**
 * Set up periodic updates (time, connection status, etc.)
 */
function setupPeriodicUpdates() {
    // Update time every minute
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Check connection status periodically
    checkConnectionStatus();
    setInterval(checkConnectionStatus, 30000);
}

/**
 * Update the date and time display
 */
function updateDateTime() {
    const timeElement = document.getElementById('time-display');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

/**
 * Show an error message to the user
 * @param {string} message - The error message to display
 * @param {string} [type='error'] - The type of message (error, warning, success, info)
 */
function showError(message, type = 'error') {
    // In a real app, you might show a toast notification or update a status bar
    console.error(`[${type.toUpperCase()}] ${message}`);
    
    // Dispatch an event that other components can listen for
    document.dispatchEvent(new CustomEvent('showNotification', {
        detail: { message, type }
    }));
}

/**
 * Add a search to history
 * @param {string} query - The search query
 */
function addToSearchHistory(query) {
    if (!query) return;
    
    // Remove any existing entries with the same query
    state.searchHistory = state.searchHistory.filter(item => item.query.toLowerCase() !== query.toLowerCase());
    
    // Add to the beginning of the array
    state.searchHistory.unshift({
        query,
        timestamp: new Date().toISOString()
    });
    
    // Keep only the last 50 searches
    if (state.searchHistory.length > 50) {
        state.searchHistory = state.searchHistory.slice(0, 50);
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
    } catch (error) {
        console.error('Error saving search history:', error);
    }
}

// Export the state and utility functions
export {
    state,
    savePreferences,
    showError,
    addToSearchHistory
};
