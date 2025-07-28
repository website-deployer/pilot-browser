// Minimal Electron main process
const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log('Test Electron app starting...');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);

console.log('app:', app); // Log the app object to see if it's defined

let mainWindow;

function createWindow() {
  console.log('Creating browser window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load a simple HTML page
  mainWindow.loadFile('index.html');
  
  // Open the DevTools in development
  mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  console.log('Browser window created');
}

// This method will be called when Electron has finished initialization
console.log('Setting up app.whenReady()...');
app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(err => {
  console.error('Error in whenReady:', err);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Log any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

console.log('Main process initialization complete');
