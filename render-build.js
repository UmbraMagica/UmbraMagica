#!/usr/bin/env node

// Build script pro Render.com
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  console.log('🏗️  Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('📦 Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}