#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { build as viteBuild } from 'vite';
import electronBuilder from 'electron-builder';
import yaml from 'js-yaml';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Clean build directories
 */
async function clean() {
  console.log('Cleaning build directories...');
  await Promise.all([
    fs.remove(path.join(rootDir, 'dist')),
    fs.remove(path.join(rootDir, 'release'))
  ]);
}

/**
 * Build the renderer process
 */
async function buildRenderer() {
  console.log('Building renderer process...');
  await viteBuild({
    configFile: path.join(rootDir, 'vite.config.js'),
    mode: process.env.NODE_ENV || 'production',
  });
}

/**
 * Copy necessary files to the dist directory
 */
async function copyFiles() {
  console.log('Copying necessary files...');
  
  // Ensure dist directory exists
  const distDir = path.join(rootDir, 'dist');
  await fs.ensureDir(distDir);
  
  // Copy main process files
  await Promise.all([
    fs.copy(
      path.join(rootDir, 'main.js'),
      path.join(distDir, 'main.js')
    ),
    fs.copy(
      path.join(rootDir, 'preload.js'),
      path.join(distDir, 'preload.js')
    )
  ]);
  
  // Create production package.json
  const packageJson = JSON.parse(
    await fs.readFile(path.join(rootDir, 'package.json'), 'utf-8')
  );
  
  const prodPackageJson = {
    ...packageJson,
    devDependencies: {},
    scripts: {
      start: 'electron .',
      test: 'echo "Error: no test specified" && exit 1'
    },
    main: 'main.js'
  };
  
  await fs.writeFile(
    path.join(distDir, 'package.json'),
    JSON.stringify(prodPackageJson, null, 2)
  );
  
  // Copy backend files if they exist
  const backendSrc = path.join(rootDir, 'backend');
  const backendDest = path.join(distDir, 'backend');
  
  if (await fs.pathExists(backendSrc)) {
    await fs.copy(backendSrc, backendDest);
  }
}

/**
 * Package the application
 */
async function packageApp() {
  console.log('Packaging application...');
  
  // Load electron-builder config
  const configPath = path.join(rootDir, 'electron-builder.yml');
  const config = yaml.load(await fs.readFile(configPath, 'utf8'));
  
  // Merge with runtime config
  const buildConfig = {
    ...config,
    directories: {
      output: 'release',
      buildResources: 'build',
      ...(config.directories || {})
    },
    files: [
      '**/*',
      '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
      '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
      '!**/node_modules/.bin',
      '!**/*.{o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
      '!.editorconfig',
      '!**/._*',
      '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
      '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
      '!**/{appveyor.yml,.travis.yml,circle.yml,.gitlab-ci.yml}',
      '!**/node_modules/aws-sdk',
    ]
  };
  
  // Build the application
  await electronBuilder.build({
    config: buildConfig,
    publish: process.argv.includes('--publish') ? 'always' : 'never',
  });
}

/**
 * Helper function to execute shell commands
 * @param {string} command - The command to execute
 * @param {Object} [options] - Options for the command
 * @returns {Promise<void>}
 */
function execAsync(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
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

/**
 * Main build function
 */
async function main() {
  try {
    // Set environment
    process.env.NODE_ENV = 'production';
    
    console.log('🚀 Starting build process...');
    
    // Clean previous builds
    await clean();
    
    // Build renderer process
    await buildRenderer();
    
    // Copy necessary files
    await copyFiles();
    
    // Package the application
    await packageApp();
    
    console.log('✅ Build completed successfully! 🎉');
    console.log('📦 You can find the packaged application in the "release" directory.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build
main().catch(console.error);
