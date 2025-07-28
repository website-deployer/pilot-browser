#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const devDistDir = path.join(rootDir, 'dev-dist');

async function clean() {
  console.log('Cleaning dev distribution directory...');
  await fs.remove(devDistDir);
  await fs.ensureDir(devDistDir);
}

async function buildRenderer() {
  console.log('Building renderer process...');
  // Use Vite to build the renderer
  execSync('npm run build:renderer', { stdio: 'inherit', cwd: rootDir });
}

async function copyFiles() {
  console.log('Copying necessary files...');
  
  // Create a minimal main.cjs file for debugging
  const mainContent = `// Minimal Electron main process
const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log('Electron app starting...');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);

let mainWindow;

function createWindow() {
  console.log('Creating browser window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Open the DevTools in development
  // mainWindow.webContents.openDevTools();
  
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
`;

  // Write the main.cjs file
  await fs.writeFile(path.join(devDistDir, 'main.cjs'), mainContent);
  
  // Copy preload.js as is
  await fs.copy(path.join(rootDir, 'preload.js'), path.join(devDistDir, 'preload.cjs'));
  
  // Copy node_modules
  console.log('Copying node_modules...');
  await fs.copy(path.join(rootDir, 'node_modules'), path.join(devDistDir, 'node_modules'));
  
  // Copy dist/renderer
  await fs.copy(path.join(distDir, 'renderer'), path.join(devDistDir, 'renderer'));
  
  // Copy backend if it exists
  const backendSrc = path.join(rootDir, 'backend');
  if (await fs.pathExists(backendSrc)) {
    console.log('Copying backend...');
    await fs.copy(backendSrc, path.join(devDistDir, 'backend'));
  }
  
  // Create a simple start script that uses the .cjs files
  await fs.writeFile(
    path.join(devDistDir, 'start.bat'),
    '@echo off\r\nstart /D "%~dp0" electron .\main.cjs\r\n'
  );
  
  // Create package.json with production dependencies only
  const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf-8'));
  const prodPackageJson = {
    ...packageJson,
    main: 'main.cjs',
    scripts: {
      start: 'electron .',
      test: 'echo \"Error: no test specified\" && exit 1'
    },
    devDependencies: {}
  };
  
  await fs.writeFile(
    path.join(devDistDir, 'package.json'),
    JSON.stringify(prodPackageJson, null, 2)
  );
}

async function main() {
  try {
    console.log('🚀 Starting development build process...');
    
    // Clean
    await clean();
    
    // Build renderer
    await buildRenderer();
    
    // Copy files
    await copyFiles();
    
    console.log('✅ Development build completed successfully! 🎉');
    console.log(`📦 You can find the development build in the "${path.relative(rootDir, devDistDir)}" directory.`);
    console.log('   To start the app, run: cd ' + path.relative(rootDir, devDistDir) + ' && npm start');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
