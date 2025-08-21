#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const [major, minor, patch] = package.version.split('.').map(Number);

function bumpVersion(type) {
  let newVersion;
  
  switch(type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    default:
      console.error('Usage: node scripts/version.js [major|minor|patch]');
      process.exit(1);
  }
  
  package.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
  
  console.log(`Version bumped to ${newVersion}`);
  console.log(`\nNext steps:`);
  console.log(`1. git add package.json`);
  console.log(`2. git commit -m "Bump version to ${newVersion}"`);
  console.log(`3. git tag v${newVersion}`);
  console.log(`4. git push origin main --tags`);
}

const type = process.argv[2];
if (!type) {
  console.log(`Current version: ${package.version}`);
  console.log('Usage: node scripts/version.js [major|minor|patch]');
  process.exit(0);
}

bumpVersion(type);
