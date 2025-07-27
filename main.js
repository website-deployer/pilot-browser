const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { spawn } = require('child_process');

// Initialize store for app preferences
const store = new Store({
  defaults: {
    windowBounds: { width: 1000, height: 700 },
    theme: 'system',
    apiUrl: 'http://localhost:8000',
  },
});

let mainWindow;
let pythonProcess = null;

function createWindow() {
  // Get the saved window bounds or use defaults
  const { width, height } = store.get('windowBounds');

  // Create the browser window
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1e1e2e',
      symbolColor: '#cdd6f4',
      height: 30,
    },
  });

  // Load the index.html file
  mainWindow.loadFile('src/renderer/index.html');

  // Save window size and position when the window is resized or moved
  mainWindow.on('resized', () => saveWindowBounds());
  mainWindow.on('moved', () => saveWindowBounds());

  // Start Python backend when in development
  if (process.env.NODE_ENV === 'development') {
    startPythonBackend();
  }

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Save window bounds to the store
function saveWindowBounds() {
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', {
      width: bounds.width,
      height: bounds.height,
    });
  }
}

// Start Python backend server
function startPythonBackend() {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  // Get the Python executable path (use 'python' by default, which will use the system's default Python)
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  
  // Start the Python backend
  pythonProcess = spawn(pythonExecutable, ['backend/main.py'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      PYTHONPATH: path.join(__dirname, 'backend'),
    },
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python backend:', err);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python backend process exited with code ${code}`);
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Stop the Python backend when the app is closed
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
    app.quit();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
