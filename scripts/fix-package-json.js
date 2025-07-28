import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixPackageJson() {
  const devDistDir = path.join(__dirname, '..', 'dev-dist');
  const packageJsonPath = path.join(devDistDir, 'package.json');
  
  try {
    // Read the existing package.json
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Update the package.json to use CommonJS
    packageJson.main = 'main.cjs';
    packageJson.type = 'commonjs';  // Explicitly set to commonjs
    
    // Write the updated package.json back
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    console.log('✅ Updated package.json to use CommonJS');
  } catch (error) {
    console.error('❌ Error updating package.json:', error);
  }
}

// Run the function
fixPackageJson().catch(console.error);
