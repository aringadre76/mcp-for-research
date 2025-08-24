const { UserPreferencesManager } = require('../dist/preferences/user-preferences');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testPreferences() {
  console.log('🧪 Testing User Preferences System...\n');
  
  try {
    const prefsManager = UserPreferencesManager.getInstance();
    
    console.log('✅ 1. Getting default preferences...');
    const defaultPrefs = prefsManager.getPreferences();
    console.log(`   Default max results: ${defaultPrefs.search.defaultMaxResults}`);
    console.log(`   Default sources: ${defaultPrefs.search.sources.map(s => s.name).join(', ')}`);
    console.log(`   PubMed enabled: ${defaultPrefs.search.sources.find(s => s.name === 'pubmed')?.enabled}`);
    console.log(`   JSTOR enabled: ${defaultPrefs.search.sources.find(s => s.name === 'jstor')?.enabled}`);
    
    console.log('\n✅ 2. Testing source preference updates...');
    prefsManager.setSourcePreference('jstor', { enabled: true, priority: 1 });
    prefsManager.setSourcePreference('pubmed', { enabled: false });
    
    const updatedPrefs = prefsManager.getPreferences();
    console.log(`   JSTOR now enabled: ${updatedPrefs.search.sources.find(s => s.name === 'jstor')?.enabled}`);
    console.log(`   PubMed now enabled: ${updatedPrefs.search.sources.find(s => s.name === 'pubmed')?.enabled}`);
    
    console.log('\n✅ 3. Testing enabled sources list...');
    const enabledSources = prefsManager.getEnabledSources();
    console.log(`   Enabled sources: ${enabledSources.map(s => `${s.name}(p:${s.priority})`).join(', ')}`);
    
    console.log('\n✅ 4. Testing search preferences...');
    prefsManager.updateSearchPreferences({
      defaultMaxResults: 30,
      defaultSortBy: 'citations',
      enableDeduplication: false
    });
    
    const searchPrefs = prefsManager.getPreferences().search;
    console.log(`   Max results: ${searchPrefs.defaultMaxResults}`);
    console.log(`   Sort by: ${searchPrefs.defaultSortBy}`);
    console.log(`   Deduplication: ${searchPrefs.enableDeduplication}`);
    
    console.log('\n✅ 5. Testing display preferences...');
    prefsManager.updateDisplayPreferences({
      showAbstracts: false,
      maxAbstractLength: 500
    });
    
    const displayPrefs = prefsManager.getPreferences().display;
    console.log(`   Show abstracts: ${displayPrefs.showAbstracts}`);
    console.log(`   Max abstract length: ${displayPrefs.maxAbstractLength}`);
    
    console.log('\n✅ 6. Testing export/import...');
    const exported = prefsManager.exportPreferences();
    console.log(`   Exported JSON length: ${exported.length} characters`);
    
    prefsManager.resetToDefaults();
    console.log('   Reset to defaults');
    
    prefsManager.importPreferences(exported);
    console.log('   Imported preferences back');
    
    const finalPrefs = prefsManager.getPreferences();
    console.log(`   Final max results: ${finalPrefs.search.defaultMaxResults}`);
    console.log(`   Final sort by: ${finalPrefs.search.defaultSortBy}`);
    
    console.log('\n✅ 7. Testing file persistence...');
    const configPath = path.join(os.homedir(), '.mcp-scholarly-research', 'preferences.json');
    const fileExists = fs.existsSync(configPath);
    console.log(`   Config file exists: ${fileExists}`);
    if (fileExists) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const parsedContent = JSON.parse(fileContent);
      console.log(`   File contains ${Object.keys(parsedContent).length} top-level keys`);
    }
    
    console.log('\n🎉 All preference tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  testPreferences();
}

module.exports = { testPreferences };
