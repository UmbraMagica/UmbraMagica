#!/usr/bin/env node

// Build script pro Render.com
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('🏗️  Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('📦 Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}