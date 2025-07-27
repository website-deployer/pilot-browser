// Quick actions functionality for the Pilot Browser

import { state, showError } from './app.js';
import { openModal } from './modals.js';

/**
 * Initialize quick actions
 */
export function initQuickActions() {
    const quickActionsContainer = document.getElementById('quick-actions');
    if (!quickActionsContainer) return;
    
    // Load quick actions
    loadQuickActions();
    
    // Listen for quick action button clicks
    quickActionsContainer.addEventListener('click', handleQuickActionClick);
    
    // Listen for custom events to update quick actions
    document.addEventListener('quickActionsUpdated', () => {
        loadQuickActions();
    });
}

/**
 * Load quick actions from state or default
 */
function loadQuickActions() {
    const quickActions = getQuickActions();
    const quickActionsContainer = document.getElementById('quick-actions');
    if (!quickActionsContainer) return;
    
    // Clear existing actions
    quickActionsContainer.innerHTML = '';
    
    // Add each quick action as a button
    quickActions.forEach((action, index) => {
        const button = document.createElement('button');
        button.className = 'quick-action';
        button.dataset.action = action.id;
        button.setAttribute('aria-label', action.label);
        button.title = action.label;
        
        // Add icon if available
        if (action.icon) {
            const icon = document.createElement('i');
            icon.className = action.icon;
            button.appendChild(icon);
        }
        
        // Add label
        const label = document.createElement('span');
        label.className = 'quick-action-label';
        label.textContent = action.label;
        button.appendChild(label);
        
        quickActionsContainer.appendChild(button);
    });
    
    // If no quick actions, show a message
    if (quickActions.length === 0) {
        const noActions = document.createElement('div');
        noActions.className = 'no-quick-actions';
        noActions.textContent = 'No quick actions available';
        quickActionsContainer.appendChild(noActions);
    }
}

/**
 * Get the list of quick actions
 * @returns {Array} Array of quick action objects
 */
function getQuickActions() {
    // In a real app, this would come from user preferences or a config file
    return [
        {
            id: 'new-tab',
            label: 'New Tab',
            icon: 'fas fa-plus',
            action: () => {
                // In a real app, this would open a new tab
                console.log('New tab action');
                window.location.href = '#'; // Reset to home
            }
        },
        {
            id: 'bookmarks',
            label: 'Bookmarks',
            icon: 'fas fa-bookmark',
            action: () => {
                // In a real app, this would show bookmarks
                console.log('Bookmarks action');
                openModal('bookmarks-modal');
            }
        },
        {
            id: 'history',
            label: 'History',
            icon: 'fas fa-history',
            action: () => {
                // In a real app, this would show history
                console.log('History action');
                openModal('history-modal');
            }
        },
        {
            id: 'downloads',
            label: 'Downloads',
            icon: 'fas fa-download',
            action: () => {
                // In a real app, this would show downloads
                console.log('Downloads action');
                openModal('downloads-modal');
            }
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: 'fas fa-cog',
            action: () => {
                openModal('settings-modal');
            }
        },
        {
            id: 'help',
            label: 'Help',
            icon: 'fas fa-question-circle',
            action: () => {
                // In a real app, this would show help
                console.log('Help action');
                openModal('help-modal');
            }
        }
    ];
}

/**
 * Handle quick action button clicks
 * @param {Event} e - The click event
 */
function handleQuickActionClick(e) {
    const button = e.target.closest('.quick-action');
    if (!button) return;
    
    const actionId = button.dataset.action;
    const quickActions = getQuickActions();
    const action = quickActions.find(a => a.id === actionId);
    
    if (action && typeof action.action === 'function') {
        try {
            action.action();
        } catch (error) {
            console.error('Error executing quick action:', error);
            showError('Failed to execute action: ' + (error.message || 'Unknown error'));
        }
    }
}

/**
 * Add a custom quick action
 * @param {Object} action - The action to add
 * @param {string} action.id - Unique ID for the action
 * @param {string} action.label - Display label for the action
 * @param {string} [action.icon] - Optional icon class (e.g., 'fas fa-icon')
 * @param {Function} action.action - Function to execute when the action is clicked
 */
export function addQuickAction(action) {
    if (!action || !action.id || !action.label || typeof action.action !== 'function') {
        console.error('Invalid quick action:', action);
        return false;
    }
    
    // In a real app, this would save to user preferences
    console.log('Adding quick action:', action);
    
    // Trigger UI update
    document.dispatchEvent(new CustomEvent('quickActionsUpdated'));
    return true;
}

/**
 * Remove a quick action by ID
 * @param {string} actionId - The ID of the action to remove
 * @returns {boolean} True if the action was removed, false otherwise
 */
export function removeQuickAction(actionId) {
    if (!actionId) return false;
    
    // In a real app, this would update user preferences
    console.log('Removing quick action:', actionId);
    
    // Trigger UI update
    document.dispatchEvent(new CustomEvent('quickActionsUpdated'));
    return true;
}

/**
 * Update an existing quick action
 * @param {string} actionId - The ID of the action to update
 * @param {Object} updates - The updates to apply to the action
 * @returns {boolean} True if the action was updated, false otherwise
 */
export function updateQuickAction(actionId, updates) {
    if (!actionId || !updates) return false;
    
    // In a real app, this would update user preferences
    console.log('Updating quick action:', actionId, updates);
    
    // Trigger UI update
    document.dispatchEvent(new CustomEvent('quickActionsUpdated'));
    return true;
}

/**
 * Get a quick action by ID
 * @param {string} actionId - The ID of the action to get
 * @returns {Object|undefined} The action, or undefined if not found
 */
export function getQuickAction(actionId) {
    if (!actionId) return undefined;
    return getQuickActions().find(a => a.id === actionId);
}

/**
 * Reorder quick actions
 * @param {Array<string>} newOrder - Array of action IDs in the new order
 * @returns {boolean} True if the order was updated, false otherwise
 */
export function reorderQuickActions(newOrder) {
    if (!Array.isArray(newOrder)) return false;
    
    // In a real app, this would update user preferences
    console.log('Reordering quick actions:', newOrder);
    
    // Trigger UI update
    document.dispatchEvent(new CustomEvent('quickActionsUpdated'));
    return true;
}
