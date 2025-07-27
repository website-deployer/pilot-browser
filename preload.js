const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // Theme management
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  onThemeChange: (callback) => ipcRenderer.on('theme-changed', (_event, theme) => callback(theme)),
  
  // API communication
  apiRequest: (endpoint, method = 'GET', data = null) => 
    ipcRenderer.invoke('api-request', { endpoint, method, data }),
  
  // Credential management
  storeCredential: (service, credentials) => 
    ipcRenderer.invoke('store-credential', { service, credentials }),
  getCredential: (service) => 
    ipcRenderer.invoke('get-credential', service),
  deleteCredential: (service) => 
    ipcRenderer.invoke('delete-credential', service),
  
  // App events
  onAppEvent: (event, callback) => {
    // Filter the event to ensure it's a valid event name
    const validEvents = ['search-started', 'search-completed', 'agent-task-update'];
    if (validEvents.includes(event)) {
      ipcRenderer.on(event, (_event, ...args) => callback(...args));
    }
  },
  
  // File system access
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (content, options) => ipcRenderer.invoke('dialog:saveFile', content, options),
  
  // System information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Debugging
  log: (level, message, ...args) => {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (validLevels.includes(level)) {
      ipcRenderer.send('log', { level, message, args });
    }
  }
});

// Handle theme changes from main process
ipcRenderer.on('theme-changed', (event, theme) => {
  // This will be handled by the renderer's theme manager
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
});

// Handle search results and agent updates
ipcRenderer.on('search-result', (event, result) => {
  window.dispatchEvent(new CustomEvent('search-result', { detail: result }));
});

ipcRenderer.on('agent-update', (event, update) => {
  window.dispatchEvent(new CustomEvent('agent-update', { detail: update }));
});
