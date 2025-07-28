#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function buildMain() {
  console.log('Building main process...');
  
  // Ensure dist directory exists
  await fs.ensureDir('dist');
  
  try {
    // Copy main process files
    await Promise.all([
      fs.copyFile('main.js', 'dist/main.js'),
      fs.copyFile('preload.js', 'dist/preload.js')
    ]);
    
    // If using TypeScript, you would compile the main process here
    // For now, we're just copying the JavaScript files
    
    console.log('Main process build complete');
  } catch (error) {
    console.error('Error building main process:', error);
    process.exit(1);
  }
}

// Run the build
buildMain();
