// Main entry point for the Pilot Browser renderer process

// Import modules
import { initApp } from './app.js';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    // Close Artifacts sidebar
    const closeArtifacts = document.getElementById('close-artifacts');
    if (closeArtifacts) {
        closeArtifacts.onclick = () => {
            document.getElementById('artifacts-sidebar').classList.remove('active');
        };
    }
});
