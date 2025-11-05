// Web search using free, opensource solutions

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source?: string
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  timestamp: string
}

// DuckDuckGo Instant Answer API (free, no API key needed)
export async function searchDuckDuckGo(query: string): Promise<SearchResponse> {
  // Try multiple CORS proxies as fallbacks
  const corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
  ]
  
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  
  for (const proxy of corsProxies) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl, { 
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const html = await response.text()
      const results = parseDuckDuckGoHTML(html)
      
      if (results.length > 0) {
        return {
          results: results.slice(0, 5),
          query,
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error)
      continue // Try next proxy
    }
  }
  
  // If all proxies fail, return empty results instead of throwing
  console.error('All CORS proxies failed for DuckDuckGo search')
  return {
    results: [],
    query,
    timestamp: new Date().toISOString(),
  }
}

function parseDuckDuckGoHTML(html: string): SearchResult[] {
  const results: SearchResult[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Find all result links
  const resultElements = doc.querySelectorAll('.result')
  
  resultElements.forEach((element) => {
    const titleElement = element.querySelector('.result__a')
    const snippetElement = element.querySelector('.result__snippet')
    const urlElement = element.querySelector('.result__url')
    
    if (titleElement && snippetElement) {
      results.push({
        title: titleElement.textContent?.trim() || '',
        url: titleElement.getAttribute('href') || urlElement?.textContent?.trim() || '',
        snippet: snippetElement.textContent?.trim() || '',
        source: 'DuckDuckGo',
      })
    }
  })
  
  return results
}

// SearxNG search (opensource metasearch engine)
// Can use public instances or self-host
export async function searchSearxNG(
  query: string,
  instance: string = 'https://searx.be'
): Promise<SearchResponse> {
  try {
    const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('SearxNG search failed')
    }
    
    const data = await response.json()
    
    const results: SearchResult[] = data.results?.slice(0, 5).map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.content || '',
      source: 'SearxNG',
    })) || []
    
    return {
      results,
      query,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('SearxNG search error:', error)
    throw new Error('Failed to search SearxNG')
  }
}

// Brave Search API (free tier available, requires API key)
// Optional if user has API key
export async function searchBrave(query: string, apiKey?: string): Promise<SearchResponse> {
  if (!apiKey) {
    throw new Error('Brave Search requires API key')
  }
  
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    })
    
    if (!response.ok) {
      throw new Error('Brave Search failed')
    }
    
    const data = await response.json()
    
    const results: SearchResult[] = data.web?.results?.slice(0, 5).map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.description || '',
      source: 'Brave',
    })) || []
    
    return {
      results,
      query,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Brave search error:', error)
    throw new Error('Failed to search Brave')
  }
}

// Main search function that tries multiple providers
export async function webSearch(
  query: string,
  options: {
    provider?: 'duckduckgo' | 'searxng' | 'brave'
    searxngInstance?: string
    braveApiKey?: string
  } = {}
): Promise<SearchResponse> {
  const provider = options.provider || 'duckduckgo'
  
  switch (provider) {
    case 'searxng':
      return searchSearxNG(query, options.searxngInstance)
    
    case 'brave':
      return searchBrave(query, options.braveApiKey)
    
    case 'duckduckgo':
    default:
      return searchDuckDuckGo(query)
  }
}

// Format search results for AI context
export function formatSearchResults(searchResponse: SearchResponse): string {
  const { results, query, timestamp } = searchResponse
  
  if (results.length === 0) {
    return `No search results found for: "${query}"`
  }
  
  let formatted = `Web Search Results for: "${query}"\n`
  formatted += `Searched at: ${new Date(timestamp).toLocaleString()}\n\n`
  
  results.forEach((result, index) => {
    formatted += `[${index + 1}] ${result.title}\n`
    formatted += `URL: ${result.url}\n`
    formatted += `${result.snippet}\n\n`
  })
  
  return formatted
}

// Store search settings in database
import { DatabaseService } from './database'

export async function getSearchProvider(): Promise<string> {
  return (await DatabaseService.getSetting('searchProvider')) || 'duckduckgo'
}

export async function setSearchProvider(provider: string): Promise<void> {
  await DatabaseService.setSetting('searchProvider', provider)
}

export async function getSearxNGInstance(): Promise<string> {
  return (await DatabaseService.getSetting('searxngInstance')) || 'https://searx.be'
}

export async function setSearxNGInstance(instance: string): Promise<void> {
  await DatabaseService.setSetting('searxngInstance', instance)
}

export async function getBraveApiKey(): Promise<string | undefined> {
  return await DatabaseService.getSetting('braveApiKey')
}

export async function setBraveApiKey(apiKey: string): Promise<void> {
  await DatabaseService.setSetting('braveApiKey', apiKey)
}

