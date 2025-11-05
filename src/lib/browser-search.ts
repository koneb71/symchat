// Browser automation requires a Node.js backend server
// This is a placeholder for future backend integration
// To enable this feature, you'll need to create a separate Node.js backend server

export type BrowserType = 'chrome' | 'edge' | 'firefox' | 'chromium' | 'api-only'

export interface BrowserSearchOptions {
  browserType: BrowserType
  headless: boolean
  useUndetected: boolean
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

// Detect installed browsers on the system
export async function detectInstalledBrowsers(): Promise<BrowserType[]> {
  // Browser detection requires backend server
  // For now, only API-only mode is available
  return ['api-only']
}

// Perform search using browser automation
export async function searchWithBrowser(
  _query: string,
  _options: BrowserSearchOptions
): Promise<SearchResult[]> {
  throw new Error(
    'Browser automation requires a Node.js backend server. ' +
    'This feature is not available in browser-only mode. ' +
    'Please use API-only search mode instead.'
  )
}

// Get browser display name
export function getBrowserDisplayName(browserType: BrowserType): string {
  const names: Record<BrowserType, string> = {
    chrome: 'Google Chrome',
    edge: 'Microsoft Edge',
    firefox: 'Mozilla Firefox',
    chromium: 'Chromium (Bundled)',
    'api-only': 'API Only (No Browser)',
  }
  return names[browserType]
}

// Check if browser is available
export async function isBrowserAvailable(browserType: BrowserType): Promise<boolean> {
  // Only API-only mode is available in browser environment
  return browserType === 'api-only'
}

