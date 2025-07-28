// Modal dialog functionality for the Pilot Browser

import { state, showError } from './app.js';

// Track all active modals
const activeModals = new Set();
let activeElementBeforeModal = null;

/**
 * Initialize modals
 */
export function initModals() {
    // Initialize all modals with data-modal attribute
    document.querySelectorAll('[data-modal]').forEach(modal => {
        initModal(modal);
    });
    
    // Handle clicks on modal open buttons
    document.addEventListener('click', (e) => {
        const openButton = e.target.closest('[data-modal-target]');
        if (openButton) {
            e.preventDefault();
            const modalId = openButton.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                openModal(modal);
            }
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModals.size > 0) {
            e.preventDefault();
            closeTopModal();
        }
    });
    
    // Initialize settings modal specifically
    initSettingsModal();
}

/**
 * Initialize a single modal
 * @param {HTMLElement} modal - The modal element to initialize
 */
function initModal(modal) {
    if (!modal.id) {
        console.warn('Modal element must have an ID');
        return;
    }
    
    // Set ARIA attributes
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    
    // Find close buttons within this modal
    const closeButtons = modal.querySelectorAll('[data-close-modal], .close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(modal);
        });
    });
    
    // Close when clicking on the overlay (outside the modal content)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Handle keyboard navigation within the modal
    modal.addEventListener('keydown', handleModalKeyboardNav);
}

/**
 * Open a modal dialog
 * @param {HTMLElement|string} modal - The modal element or its ID
 */
export function openModal(modal) {
    if (typeof modal === 'string') {
        modal = document.getElementById(modal);
    }
    
    if (!modal || !(modal instanceof HTMLElement)) {
        console.error('Invalid modal element');
        return;
    }
    
    // If already open, do nothing
    if (activeModals.has(modal)) {
        return;
    }
    
    // Store the currently focused element to return to when modal closes
    activeElementBeforeModal = document.activeElement;
    
    // Add to active modals
    activeModals.add(modal);
    
    // Show the modal
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    
    // Set focus to the first focusable element in the modal
    setTimeout(() => {
        const focusable = getFocusableElements(modal);
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }, 10);
    
    // Emit event
    const event = new CustomEvent('modalOpened', { detail: { modal } });
    modal.dispatchEvent(event);
    document.dispatchEvent(event);
}

/**
 * Close a modal dialog
 * @param {HTMLElement} modal - The modal element to close
 */
export function closeModal(modal) {
    if (!modal || !activeModals.has(modal)) {
        return;
    }
    
    // Hide the modal
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    
    // Remove from active modals
    activeModals.delete(modal);
    
    // Update body class
    if (activeModals.size === 0) {
        document.body.classList.remove('modal-open');
        
        // Return focus to the element that had focus before the modal opened
        if (activeElementBeforeModal && 'focus' in activeElementBeforeModal) {
            setTimeout(() => {
                activeElementBeforeModal.focus();
                activeElementBeforeModal = null;
            }, 10);
        }
    }
    
    // Emit event
    const event = new CustomEvent('modalClosed', { detail: { modal } });
    modal.dispatchEvent(event);
    document.dispatchEvent(event);
}

/**
 * Close the topmost modal
 */
function closeTopModal() {
    if (activeModals.size === 0) return;
    
    // Get the last opened modal (top of the stack)
    const modal = Array.from(activeModals).pop();
    closeModal(modal);
}

/**
 * Handle keyboard navigation within a modal
 * @param {KeyboardEvent} e - The keydown event
 */
function handleModalKeyboardNav(e) {
    const modal = e.currentTarget;
    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) return;
    
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    
    // Handle Tab key
    if (e.key === 'Tab') {
        if (e.shiftKey) {
            // Shift + Tab: move focus to previous element
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab: move focus to next element
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
}

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - The container element
 * @returns {Array<HTMLElement>} Array of focusable elements
 */
function getFocusableElements(container) {
    if (!container) return [];
    
    return Array.from(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
        // Filter out hidden, disabled, and elements with negative tabindex
        return !el.hasAttribute('disabled') && 
               !el.getAttribute('aria-hidden') &&
               el.offsetParent !== null &&
               (el.offsetWidth > 0 || el.offsetHeight > 0);
    });
}

/**
 * Initialize the settings modal with its specific functionality
 */
function initSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) return;
    
    // Load saved settings when modal opens
    settingsModal.addEventListener('modalOpened', loadSettings);
    
    // Handle settings form submission
    const settingsForm = settingsModal.querySelector('form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }
    
    // Initialize theme toggle in settings
    const themeSelect = settingsModal.querySelector('#theme-select');
    if (themeSelect) {
        themeSelect.value = state.preferences.theme || 'system';
    }
    
    // Initialize safe search toggle
    const safeSearchToggle = settingsModal.querySelector('#safe-search-toggle');
    if (safeSearchToggle) {
        safeSearchToggle.checked = state.preferences.safeSearch !== false;
    }
    
    // Initialize search engine select
    const searchEngineSelect = settingsModal.querySelector('#search-engine-select');
    if (searchEngineSelect) {
        searchEngineSelect.value = state.preferences.searchEngine || 'google';
    }
    
    // Initialize AI model select
    const aiModelSelect = settingsModal.querySelector('#ai-model-select');
    if (aiModelSelect) {
        aiModelSelect.value = state.preferences.aiModel || 'gpt-4';
    }
    
    // Initialize auto AI mode toggle
    const autoAIModeToggle = settingsModal.querySelector('#auto-ai-mode');
    if (autoAIModeToggle) {
        autoAIModeToggle.checked = state.preferences.autoAIMode !== false;
    }
}

/**
 * Load settings into the settings form
 */
function loadSettings() {
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) return;
    
    // Load theme preference
    const themeSelect = settingsModal.querySelector('#theme-select');
    if (themeSelect) {
        themeSelect.value = state.preferences.theme || 'system';
    }
    
    // Load safe search preference
    const safeSearchToggle = settingsModal.querySelector('#safe-search-toggle');
    if (safeSearchToggle) {
        safeSearchToggle.checked = state.preferences.safeSearch !== false;
    }
    
    // Load search engine preference
    const searchEngineSelect = settingsModal.querySelector('#search-engine-select');
    if (searchEngineSelect) {
        searchEngineSelect.value = state.preferences.searchEngine || 'google';
    }
    
    // Load AI model preference
    const aiModelSelect = settingsModal.querySelector('#ai-model-select');
    if (aiModelSelect) {
        aiModelSelect.value = state.preferences.aiModel || 'gpt-4';
    }
    
    // Load auto AI mode preference
    const autoAIModeToggle = settingsModal.querySelector('#auto-ai-mode');
    if (autoAIModeToggle) {
        autoAIModeToggle.checked = state.preferences.autoAIMode !== false;
    }
}

/**
 * Save settings from the settings form
 * @param {Event} e - The form submission event
 */
function saveSettings(e) {
    e.preventDefault();
    
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) return;
    
    // Get values from form
    const themeSelect = settingsModal.querySelector('#theme-select');
    const safeSearchToggle = settingsModal.querySelector('#safe-search-toggle');
    const searchEngineSelect = settingsModal.querySelector('#search-engine-select');
    const aiModelSelect = settingsModal.querySelector('#ai-model-select');
    const autoAIModeToggle = settingsModal.querySelector('#auto-ai-mode');
    
    // Update preferences
    state.preferences = {
        ...state.preferences,
        theme: themeSelect ? themeSelect.value : 'system',
        safeSearch: safeSearchToggle ? safeSearchToggle.checked : true,
        searchEngine: searchEngineSelect ? searchEngineSelect.value : 'google',
        aiModel: aiModelSelect ? aiModelSelect.value : 'gpt-4',
        autoAIMode: autoAIModeToggle ? autoAIModeToggle.checked : true
    };
    
    // Save to localStorage
    try {
        localStorage.setItem('preferences', JSON.stringify(state.preferences));
        
        // Show success message
        showError('Settings saved successfully', 'success');
        
        // Close the modal after a short delay
        setTimeout(() => {
            closeModal(settingsModal);
        }, 1000);
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showError('Failed to save settings', 'error');
    }
}

