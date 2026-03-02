import { existsSync } from 'fs';
import { execSync } from 'child_process';

/**
 * Locate a system Chrome/Chromium binary for use with puppeteer-core.
 * Respects PUPPETEER_EXECUTABLE_PATH and CHROME_PATH env vars, then
 * falls back to well-known installation paths per platform.
 */
export function findChromeExecutable(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }

  const candidates: string[] = [];

  if (process.platform === 'linux') {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    );
  } else if (process.platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    );
    if (process.env.LOCALAPPDATA) {
      candidates.push(
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      );
    }
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  if (process.platform !== 'win32') {
    try {
      const result = execSync(
        'which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null',
        { encoding: 'utf-8' },
      ).trim();
      if (result) return result;
    } catch {
      // not found via which
    }
  }

  throw new Error(
    'Could not find Chrome or Chromium. Install Google Chrome or set the ' +
    'PUPPETEER_EXECUTABLE_PATH environment variable. Browser-based features ' +
    '(Google Scholar scraping, ArXiv full-text) require a Chrome/Chromium binary.',
  );
}
