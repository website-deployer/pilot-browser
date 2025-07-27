// Sidebar functionality for the Pilot Browser

import { state } from './app.js';

/**
 * Initialize sidebar functionality
 */
export function initSidebar() {
    const menuBtn = document.getElementById('menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.createElement('div');
    
    // Create overlay if it doesn't exist
    if (!document.querySelector('.sidebar-overlay')) {
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    
    // Toggle sidebar
    function toggleSidebar() {
        if (!sidebar) return;
        
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
        
        // Update ARIA attributes
        const isExpanded = sidebar.classList.contains('active');
        sidebar.setAttribute('aria-expanded', isExpanded);
        menuBtn.setAttribute('aria-expanded', isExpanded);
        
        // Emit event
        document.dispatchEvent(new CustomEvent('sidebarToggled', {
            detail: { isOpen: isExpanded }
        }));
    }
    
    // Open sidebar
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleSidebar);
    }
    
    // Close sidebar
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', toggleSidebar);
    }
    
    // Close sidebar when clicking outside
    overlay.addEventListener('click', toggleSidebar);
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Close sidebar with Escape key
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
    
    // Initialize sidebar items
    initSidebarItems();
}

/**
 * Initialize sidebar navigation items
 */
function initSidebarItems() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const navItems = sidebar.querySelectorAll('.nav-item');
    
    navItems.forEach((item, index) => {
        // Set ARIA attributes
        item.setAttribute('role', 'listitem');
        item.setAttribute('tabindex', '0');
        
        // Handle keyboard navigation
        item.addEventListener('keydown', (e) => {
            // Handle Enter/Space to activate
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
            
            // Handle arrow key navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const nextItem = navItems[Math.min(index + 1, navItems.length - 1)];
                nextItem.focus();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevItem = navItems[Math.max(0, index - 1)];
                prevItem.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                navItems[0].focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                navItems[navItems.length - 1].focus();
            }
        });
        
        // Handle click
        item.addEventListener('click', (e) => {
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Get the section to show
            const sectionId = item.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
            }
            
            // Close sidebar on mobile after clicking a link
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    toggleSidebar();
                }
            }
            
            // Emit event
            document.dispatchEvent(new CustomEvent('sidebarItemSelected', {
                detail: {
                    id: sectionId,
                    label: item.textContent.trim()
                }
            }));
        });
    });
    
    // Activate the first item by default
    if (navItems.length > 0) {
        navItems[0].classList.add('active');
        const defaultSection = navItems[0].getAttribute('data-section');
        if (defaultSection) {
            showSection(defaultSection);
        }
    }
}

/**
 * Show a specific section in the main content area
 * @param {string} sectionId - The ID of the section to show
 */
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.main-content > section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Focus the first focusable element in the section
        const focusable = targetSection.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            focusable.focus();
        }
    }
}

/**
 * Toggle the sidebar open/close state
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (!sidebar || !overlay) return;
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.classList.toggle('sidebar-open');
    
    // Update ARIA attributes
    const isExpanded = sidebar.classList.contains('active');
    sidebar.setAttribute('aria-expanded', isExpanded);
    
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.setAttribute('aria-expanded', isExpanded);
    }
    
    // Emit event
    document.dispatchEvent(new CustomEvent('sidebarToggled', {
        detail: { isOpen: isExpanded }
    }));
}

/**
 * Update the sidebar with the current route or active section
 */
export function updateSidebarState() {
    // This would be used to update the active state based on the current route
    // Implementation depends on your routing solution
    
    // Example implementation:
    // 1. Get current route/section from your router
    // 2. Find the corresponding nav item and make it active
    // 3. Show the appropriate section
    
    console.log('Updating sidebar state based on current route');
}

/**
 * Add a notification badge to a sidebar item
 * @param {string} sectionId - The ID of the section to add the badge to
 * @param {string|number} content - The content of the badge
 */
export function addSidebarBadge(sectionId, content) {
    const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (!navItem) return;
    
    // Remove existing badge if any
    let badge = navItem.querySelector('.badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge';
        navItem.appendChild(badge);
    }
    
    badge.textContent = content;
    badge.setAttribute('aria-label', `${content} notifications`);
    
    return badge;
}

/**
 * Remove a notification badge from a sidebar item
 * @param {string} sectionId - The ID of the section to remove the badge from
 */
export function removeSidebarBadge(sectionId) {
    const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (!navItem) return;
    
    const badge = navItem.querySelector('.badge');
    if (badge) {
        badge.remove();
    }
}

// Export the toggle function for external use
export { toggleSidebar };
