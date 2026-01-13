import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const src = path.join(distDir, 'index.html');
const dest = path.join(distDir, '404.html');

try {
  fs.copyFileSync(src, dest);
  console.log('✅ Copied index.html to 404.html successfully');
} catch (error) {
  console.error('❌ Failed to copy file:', error.message);
  process.exit(1);
}
