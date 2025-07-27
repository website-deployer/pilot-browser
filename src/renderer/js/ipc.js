// IPC (Inter-Process Communication) for the Pilot Browser
// Handles communication between the renderer and main processes

// Store IPC handlers
const ipcHandlers = new Map();

// Store response callbacks for request/response pattern
const responseCallbacks = new Map();
let requestId = 0;

/**
 * Check the connection status to the main process
 */
export function checkConnectionStatus() {
    // In a real app, this would check if we can communicate with the main process
    // For now, we'll assume we're always connected in the browser
    const isConnected = true;
    
    // Update UI based on connection status
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
        connectionStatus.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
        connectionStatus.title = isConnected ? 'Connected' : 'Disconnected';
    }
    
    return isConnected;
}

/**
 * Set up IPC message handlers
 */
export function setupIpcHandlers() {
    // In a real Electron app, this would use the ipcRenderer API
    // For now, we'll simulate it with custom events
    
    // Listen for messages from the main process
    window.addEventListener('message', (event) => {
        // In a real app, we would validate the event.origin for security
        const { channel, data, requestId } = event.data || {};
        
        if (!channel) return;
        
        // Handle response to a previous request
        if (requestId && responseCallbacks.has(requestId)) {
            const { resolve, reject } = responseCallbacks.get(requestId);
            responseCallbacks.delete(requestId);
            
            if (data && data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data);
            }
            return;
        }
        
        // Handle incoming messages
        if (ipcHandlers.has(channel)) {
            const handlers = ipcHandlers.get(channel);
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in IPC handler for channel "${channel}":`, error);
                }
            });
        }
    });
    
    // Set up default handlers for common events
    setupDefaultHandlers();
}

/**
 * Set up default IPC handlers
 */
function setupDefaultHandlers() {
    // Handle window controls
    on('window:minimize', () => {
        // In a real app, this would minimize the window
        console.log('Minimize window');
    });
    
    on('window:maximize', () => {
        // In a real app, this would maximize/restore the window
        console.log('Toggle maximize window');
    });
    
    on('window:close', () => {
        // In a real app, this would close the window
        console.log('Close window');
    });
    
    // Handle app events
    on('app:version', (data) => {
        console.log('App version:', data);
    });
    
    on('app:update-available', (data) => {
        console.log('Update available:', data);
        // Show update notification to the user
    });
    
    on('app:update-downloaded', () => {
        console.log('Update downloaded, ready to install');
        // Prompt user to restart the app to install updates
    });
    
    // Handle theme changes
    on('theme:changed', (data) => {
        console.log('Theme changed:', data);
        // Update UI to reflect the new theme
    });
    
    // Handle network status changes
    on('network:online', () => {
        console.log('Network is online');
        checkConnectionStatus();
    });
    
    on('network:offline', () => {
        console.log('Network is offline');
        checkConnectionStatus();
    });
    
    // Handle authentication events
    on('auth:login', (data) => {
        console.log('User logged in:', data.user?.email || 'Unknown user');
        // Update UI to show user is logged in
    });
    
    on('auth:logout', () => {
        console.log('User logged out');
        // Update UI to show user is logged out
    });
    
    // Handle download events
    on('download:started', (data) => {
        console.log('Download started:', data);
        // Show download in progress
    });
    
    on('download:progress', (data) => {
        console.log('Download progress:', data);
        // Update download progress
    });
    
    on('download:completed', (data) => {
        console.log('Download completed:', data);
        // Show download complete notification
    });
    
    on('download:error', (error) => {
        console.error('Download error:', error);
        // Show download error notification
    });
}

/**
 * Send a message to the main process
 * @param {string} channel - The channel to send the message on
 * @param {*} [data] - Optional data to send with the message
 * @returns {Promise} A promise that resolves with the response from the main process
 */
export function send(channel, data) {
    return new Promise((resolve, reject) => {
        if (!channel) {
            reject(new Error('Channel is required'));
            return;
        }
        
        // In a real app, this would use ipcRenderer.send
        console.log(`[IPC] Sending message on channel "${channel}":`, data);
        
        // For demo purposes, we'll simulate a response
        setTimeout(() => {
            // In a real app, the main process would respond asynchronously
            // For now, we'll just resolve with some mock data
            resolve({ success: true, channel, data });
        }, 100);
    });
}

/**
 * Send a message to the main process and wait for a response
 * @param {string} channel - The channel to send the message on
 * @param {*} [data] - Optional data to send with the message
 * @returns {Promise} A promise that resolves with the response from the main process
 */
export function invoke(channel, data) {
    return new Promise((resolve, reject) => {
        if (!channel) {
            reject(new Error('Channel is required'));
            return;
        }
        
        const currentRequestId = ++requestId;
        
        // Store the callbacks to handle the response
        responseCallbacks.set(currentRequestId, { resolve, reject });
        
        // In a real app, this would use ipcRenderer.invoke
        console.log(`[IPC] Invoking on channel "${channel}" (${currentRequestId}):`, data);
        
        // For demo purposes, we'll simulate a response
        setTimeout(() => {
            // In a real app, the main process would respond asynchronously
            // For now, we'll just resolve with some mock data
            const response = { 
                success: true, 
                channel, 
                requestId: currentRequestId,
                data: {
                    message: `Response to ${channel}`,
                    timestamp: new Date().toISOString()
                }
            };
            
            // Simulate receiving a response from the main process
            window.dispatchEvent(new MessageEvent('message', {
                data: {
                    channel: `${channel}:response`,
                    requestId: currentRequestId,
                    data: response
                }
            }));
        }, 200);
    });
}

/**
 * Listen for messages on a channel
 * @param {string} channel - The channel to listen on
 * @param {Function} callback - The function to call when a message is received
 * @returns {Function} A function to remove the listener
 */
export function on(channel, callback) {
    if (!channel || typeof callback !== 'function') {
        return () => {};
    }
    
    if (!ipcHandlers.has(channel)) {
        ipcHandlers.set(channel, new Set());
    }
    
    const handlers = ipcHandlers.get(channel);
    handlers.add(callback);
    
    // Return a function to remove the listener
    return () => {
        if (ipcHandlers.has(channel)) {
            const handlers = ipcHandlers.get(channel);
            handlers.delete(callback);
            
            if (handlers.size === 0) {
                ipcHandlers.delete(channel);
            }
        }
    };
}

/**
 * Remove all listeners for a channel
 * @param {string} channel - The channel to remove listeners from
 */
export function removeAllListeners(channel) {
    if (channel) {
        ipcHandlers.delete(channel);
    } else {
        ipcHandlers.clear();
    }
}

/**
 * Check if the app is running in Electron
 * @returns {boolean} True if running in Electron, false otherwise
 */
export function isElectron() {
    // In a real app, this would check for the presence of Electron APIs
    return false;
}

/**
 * Get the current platform (win32, darwin, linux)
 * @returns {string} The current platform
 */
export function getPlatform() {
    // In a real app, this would get the platform from the main process
    // For now, we'll detect the platform from the user agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) return 'win32';
    if (userAgent.includes('mac')) return 'darwin';
    if (userAgent.includes('linux')) return 'linux';
    
    return 'unknown';
}

/**
 * Get the app version
 * @returns {Promise<string>} A promise that resolves with the app version
 */
export function getAppVersion() {
    // In a real app, this would get the version from the main process
    return Promise.resolve('1.0.0');
}

/**
 * Check for updates
 * @returns {Promise<Object>} A promise that resolves with update information
 */
export function checkForUpdates() {
    // In a real app, this would check for updates
    return Promise.resolve({
        updateAvailable: false,
        version: '1.0.0',
        releaseNotes: '',
        releaseDate: new Date().toISOString()
    });
}

/**
 * Restart the app to install updates
 * @returns {Promise<void>} A promise that resolves when the app is restarting
 */
export function restartApp() {
    // In a real app, this would restart the app to install updates
    console.log('Restarting app to install updates...');
    return Promise.resolve();
}
