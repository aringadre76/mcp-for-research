#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function publishToBoth() {
  console.log('🚀 Publishing to both npm and GitHub Packages...\n');

  try {
    // Step 1: Publish to npm (main registry)
    console.log('📦 Publishing to npm...');
    execSync('npm publish', { stdio: 'inherit' });
    console.log('✅ Successfully published to npm!\n');

    // Step 2: Switch to GitHub Packages package.json
    console.log('🔄 Switching to GitHub Packages configuration...');
    const originalPackage = fs.readFileSync('package.json', 'utf8');
    const githubPackage = fs.readFileSync('package-github.json', 'utf8');
    
    // Backup original package.json
    fs.writeFileSync('package.json.backup', originalPackage);
    
    // Use GitHub package.json
    fs.writeFileSync('package.json', githubPackage);
    
    // Step 3: Publish to GitHub Packages
    console.log('📦 Publishing to GitHub Packages...');
    execSync('npm publish --registry=https://npm.pkg.github.com', { stdio: 'inherit' });
    console.log('✅ Successfully published to GitHub Packages!\n');

    // Step 4: Restore original package.json
    console.log('🔄 Restoring original package.json...');
    fs.writeFileSync('package.json', originalPackage);
    fs.unlinkSync('package.json.backup');
    
    console.log('🎉 Successfully published to BOTH registries!');
    console.log('\n📋 Package Locations:');
    console.log('   • npm: https://www.npmjs.com/package/scholarly-research-mcp');
    console.log('   • GitHub: https://github.com/aringadre76/mcp-for-research/packages');
    
  } catch (error) {
    console.error('❌ Error during publishing:', error.message);
    
    // Restore package.json if there was an error
    if (fs.existsSync('package.json.backup')) {
      console.log('🔄 Restoring package.json from backup...');
      const backup = fs.readFileSync('package.json.backup', 'utf8');
      fs.writeFileSync('package.json', backup);
      fs.unlinkSync('package.json.backup');
    }
    
    process.exit(1);
  }
}

publishToBoth();
