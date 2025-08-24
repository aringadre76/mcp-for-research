const fs = require('fs');
const path = require('path');

function testBuild() {
  console.log('Testing Build with ArXiv Integration...\n');
  
  try {
    console.log('1. Checking if dist directory exists...');
    if (!fs.existsSync('dist')) {
      throw new Error('dist directory not found. Run "npm run build" first.');
    }
    console.log('✓ dist directory exists');
    
    console.log('\n2. Checking if ArXiv adapter was built...');
    const arxivPath = path.join('dist', 'adapters', 'arxiv.js');
    if (!fs.existsSync(arxivPath)) {
      throw new Error('ArXiv adapter not built. Check build process.');
    }
    console.log('✓ ArXiv adapter built successfully');
    
    console.log('\n3. Checking if main index was built...');
    const indexPath = path.join('dist', 'index.js');
    if (!fs.existsSync(indexPath)) {
      throw new Error('Main index not built. Check build process.');
    }
    console.log('✓ Main index built successfully');
    
    console.log('\n4. Checking if unified search adapters were built...');
    const unifiedPath = path.join('dist', 'adapters', 'unified-search.js');
    const enhancedPath = path.join('dist', 'adapters', 'enhanced-unified-search.js');
    const preferencePath = path.join('dist', 'adapters', 'preference-aware-unified-search.js');
    
    if (!fs.existsSync(unifiedPath)) {
      throw new Error('Unified search adapter not built.');
    }
    if (!fs.existsSync(enhancedPath)) {
      throw new Error('Enhanced unified search adapter not built.');
    }
    if (!fs.existsSync(preferencePath)) {
      throw new Error('Preference-aware unified search adapter not built.');
    }
    console.log('✓ All unified search adapters built successfully');
    
    console.log('\n5. Checking if user preferences were built...');
    const preferencesPath = path.join('dist', 'preferences', 'user-preferences.js');
    if (!fs.existsSync(preferencesPath)) {
      throw new Error('User preferences not built.');
    }
    console.log('✓ User preferences built successfully');
    
    console.log('\n6. Testing module imports...');
    try {
      require('../dist/adapters/arxiv');
      require('../dist/adapters/unified-search');
      require('../dist/adapters/enhanced-unified-search');
      require('../dist/adapters/preference-aware-unified-search');
      require('../dist/preferences/user-preferences');
      console.log('✓ All modules can be imported successfully');
    } catch (error) {
      throw new Error(`Module import failed: ${error.message}`);
    }
    
    console.log('\n✅ Build test completed successfully!');
    console.log('\nAll ArXiv integration components are properly built and importable.');
    
  } catch (error) {
    console.error('❌ Build test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testBuild();
}

module.exports = { testBuild };
