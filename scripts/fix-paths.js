#!/usr/bin/env node

/**
 * Post-build script to fix absolute asset paths for GitHub Pages subpath deployment
 * Converts /main-*.js to main-*.js (relative paths)
 * This is needed because Shakespeare builder uses absolute paths
 */

import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

function fixPathsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Convert absolute paths to relative paths
    // /main-*.js → main-*.js
    // /shakespeare_tailwind.*.js → shakespeare_tailwind.*.js
    // /manifest.webmanifest → manifest.webmanifest
    
    const beforeSize = content.length;
    
    content = content.replace(/src="\/([^"]+\.(js|css))"/g, 'src="$1"');
    content = content.replace(/href="\/([^"]+\.(js|css|webmanifest))"/g, 'href="$1"');
    content = content.replace(/href="\/manifest\.webmanifest"/g, 'href="manifest.webmanifest"');
    
    const afterSize = content.length;
    
    fs.writeFileSync(filePath, content, 'utf-8');
    
    console.log(`✅ Fixed paths in ${path.basename(filePath)}`);
    console.log(`   Changed ${beforeSize - afterSize} bytes of absolute paths to relative`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error fixing paths in ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Post-build: Fixing asset paths for GitHub Pages...');

let success = true;
success = fixPathsInFile(indexPath) && success;
success = fixPathsInFile(notFoundPath) && success;

if (success) {
  console.log('\n✨ All paths fixed successfully!');
  process.exit(0);
} else {
  console.error('\n❌ Failed to fix some paths');
  process.exit(1);
}
