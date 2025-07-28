#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildMain() {
  console.log('Building main process...');
  
  try {
    // Ensure dist directory exists
    await fs.ensureDir('dist');
    
    // Get the root directory (one level up from scripts)
    const rootDir = path.resolve(__dirname, '..');
    
    // Copy main process files
    await Promise.all([
      fs.copy(
        path.join(rootDir, 'main.js'), 
        path.join(rootDir, 'dist/main.js')
      ),
      fs.copy(
        path.join(rootDir, 'preload.js'), 
        path.join(rootDir, 'dist/preload.js')
      ),
      fs.copy(
        path.join(rootDir, 'package.json'), 
        path.join(rootDir, 'dist/package.json')
      )
    ]);

    // Copy backend directory if it exists
    const backendSrc = path.join(rootDir, 'backend');
    const backendDest = path.join(rootDir, 'dist/backend');
    
    if (await fs.pathExists(backendSrc)) {
      await fs.copy(backendSrc, backendDest);
    }
    
    console.log('✅ Main process build complete');
  } catch (error) {
    console.error('❌ Error building main process:', error);
    process.exit(1);
  }
}

// Run the build
buildMain().catch(console.error);
