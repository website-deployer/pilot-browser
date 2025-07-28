// Debug script to check Electron module loading
console.log('Debugging Electron module loading...');

// Try to require Electron and log the result
try {
  console.log('Attempting to require electron...');
  const electron = require('electron');
  console.log('Electron module loaded successfully:', Object.keys(electron));
  
  if (electron.app) {
    console.log('app object exists:', electron.app);
  } else {
    console.error('app object is undefined in Electron module');
  }
  
  // Try to get the app version
  try {
    console.log('Electron version:', process.versions.electron);
    console.log('Chrome version:', process.versions.chrome);
    console.log('Node version:', process.version);
  } catch (e) {
    console.error('Error getting versions:', e);
  }
  
} catch (error) {
  console.error('Error requiring electron:', error);
  
  // Try to get more details about the error
  console.log('Error details:', {
    code: error.code,
    path: error.path,
    message: error.message,
    stack: error.stack
  });
  
  // Check if the module exists
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check node_modules/electron
    const electronPath = path.join(process.cwd(), 'node_modules', 'electron');
    console.log(`Electron path exists: ${fs.existsSync(electronPath)}`);
    
    // Check if it's a directory
    if (fs.existsSync(electronPath)) {
      console.log('Electron directory contents:', fs.readdirSync(electronPath));
      
      // Check for index.js or package.json
      const indexJsPath = path.join(electronPath, 'index.js');
      const packageJsonPath = path.join(electronPath, 'package.json');
      
      console.log(`index.js exists: ${fs.existsSync(indexJsPath)}`);
      console.log(`package.json exists: ${fs.existsSync(packageJsonPath)}`);
      
      if (fs.existsSync(packageJsonPath)) {
        console.log('Electron package.json:', 
          JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')));
      }
    }
  } catch (e) {
    console.error('Error checking Electron installation:', e);
  }
}
