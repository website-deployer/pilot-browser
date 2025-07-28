#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { build } = require('vite');
const { build: electronBuild } = require('electron-builder');

// Clean build directories
async function clean() {
  console.log('Cleaning build directories...');
  await Promise.all([
    fs.remove('dist'),
    fs.remove('release')
  ]);
}

// Build the renderer process
async function buildRenderer() {
  console.log('Building renderer process...');
  await build({
    configFile: 'vite.config.js',
    mode: process.env.NODE_ENV || 'production',
  });
}

// Copy backend files to the dist directory
async function copyBackend() {
  console.log('Copying backend files...');
  await fs.copy('backend', 'dist/backend');
  
  // Ensure the Python virtual environment is set up
  if (!fs.existsSync('backend/venv')) {
    console.log('Setting up Python virtual environment...');
    await execAsync('python -m venv backend/venv', { cwd: process.cwd() });
    
    // Install Python dependencies
    console.log('Installing Python dependencies...');
    const pipCmd = process.platform === 'win32' 
      ? 'backend\\venv\\Scripts\\pip' 
      : 'backend/venv/bin/pip';
      
    await execAsync(`${pipCmd} install -r backend/requirements.txt`, { 
      cwd: process.cwd() 
    });
  }
}

// Build the main process
async function buildMain() {
  console.log('Building main process...');
  // In a TypeScript project, you would compile the main process here
  // For now, we'll just copy the files
  await fs.copy('main.js', 'dist/main.js');
  await fs.copy('preload.js', 'dist/preload.js');
}

// Package the application
async function packageApp() {
  console.log('Packaging application...');
  await electronBuild({
    config: 'electron-builder.yml',
    publish: process.argv.includes('--publish') ? 'always' : 'never',
  });
}

// Helper function to execute shell commands
function execAsync(command, options) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

// Main build function
async function main() {
  try {
    // Set environment
    process.env.NODE_ENV = 'production';
    
    // Run build steps
    await clean();
    await buildRenderer();
    await buildMain();
    await copyBackend();
    await packageApp();
    
    console.log('Build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run the build
main();
