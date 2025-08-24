import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SourcePreference {
  name: string;
  enabled: boolean;
  priority: number;
  maxResults?: number;
}

export interface SearchPreferences {
  defaultMaxResults: number;
  defaultSortBy: 'relevance' | 'date' | 'citations';
  preferFirecrawl: boolean;
  sources: SourcePreference[];
  enableDeduplication: boolean;
}

export interface UserPreferences {
  search: SearchPreferences;
  display: {
    showAbstracts: boolean;
    showCitations: boolean;
    showUrls: boolean;
    maxAbstractLength: number;
  };
  cache: {
    enabled: boolean;
    ttlMinutes: number;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  search: {
    defaultMaxResults: 20,
    defaultSortBy: 'relevance',
    preferFirecrawl: true,
    enableDeduplication: true,
    sources: [
      { name: 'pubmed', enabled: true, priority: 1, maxResults: 15 },
      { name: 'google-scholar', enabled: true, priority: 2, maxResults: 15 },
      { name: 'arxiv', enabled: true, priority: 3, maxResults: 15 },
      { name: 'jstor', enabled: false, priority: 4, maxResults: 10 }
    ]
  },
  display: {
    showAbstracts: true,
    showCitations: true,
    showUrls: true,
    maxAbstractLength: 200
  },
  cache: {
    enabled: true,
    ttlMinutes: 60
  }
};

export class UserPreferencesManager {
  private static instance: UserPreferencesManager;
  private preferences: UserPreferences;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(os.homedir(), '.mcp-scholarly-research', 'preferences.json');
    this.preferences = this.loadPreferences();
  }

  public static getInstance(): UserPreferencesManager {
    if (!UserPreferencesManager.instance) {
      UserPreferencesManager.instance = new UserPreferencesManager();
    }
    return UserPreferencesManager.instance;
  }

  private loadPreferences(): UserPreferences {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const loaded = JSON.parse(data);
        return this.mergeWithDefaults(loaded);
      }
    } catch (error) {
      console.warn('Failed to load preferences, using defaults:', error);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
  }

  private mergeWithDefaults(loaded: Partial<UserPreferences>): UserPreferences {
    const merged = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
    
    if (loaded.search) {
      Object.assign(merged.search, loaded.search);
      if (loaded.search.sources) {
        merged.search.sources = loaded.search.sources.map(source => {
          const defaultSource = DEFAULT_PREFERENCES.search.sources.find(s => s.name === source.name);
          return { ...defaultSource, ...source };
        });
      }
    }
    
    if (loaded.display) {
      Object.assign(merged.display, loaded.display);
    }
    
    if (loaded.cache) {
      Object.assign(merged.cache, loaded.cache);
    }
    
    return merged;
  }

  private savePreferences(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.preferences, null, 2));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  public getPreferences(): UserPreferences {
    return JSON.parse(JSON.stringify(this.preferences));
  }

  public updateSearchPreferences(updates: Partial<SearchPreferences>): void {
    Object.assign(this.preferences.search, updates);
    this.savePreferences();
  }

  public updateDisplayPreferences(updates: Partial<UserPreferences['display']>): void {
    Object.assign(this.preferences.display, updates);
    this.savePreferences();
  }

  public updateCachePreferences(updates: Partial<UserPreferences['cache']>): void {
    Object.assign(this.preferences.cache, updates);
    this.savePreferences();
  }

  public setSourcePreference(sourceName: string, preferences: Partial<SourcePreference>): void {
    const sourceIndex = this.preferences.search.sources.findIndex(s => s.name === sourceName);
    if (sourceIndex >= 0) {
      Object.assign(this.preferences.search.sources[sourceIndex], preferences);
    } else {
      this.preferences.search.sources.push({
        name: sourceName,
        enabled: true,
        priority: this.preferences.search.sources.length + 1,
        ...preferences
      });
    }
    this.savePreferences();
  }

  public getEnabledSources(): SourcePreference[] {
    return this.preferences.search.sources
      .filter(source => source.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  public getSourcesForSearch(): string[] {
    return this.getEnabledSources().map(source => source.name);
  }

  public resetToDefaults(): void {
    this.preferences = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
    this.savePreferences();
  }

  public exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  public importPreferences(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString);
      this.preferences = this.mergeWithDefaults(imported);
      this.savePreferences();
    } catch (error) {
      throw new Error('Invalid preferences JSON format');
    }
  }
}

