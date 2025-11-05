// Automatic web search - analyze user input and decide if/what to search

import { webSearch, formatSearchResults, type SearchResponse } from './web-search'
import { searchWithBrowser, type BrowserType } from './browser-search'

// Determine if a user message needs web search
export function shouldSearchWeb(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  
  // Keywords that suggest need for web search
  const searchIndicators = [
    // Questions about current/recent information
    'latest', 'recent', 'current', 'today', 'now', 'this year', '2024', '2025',
    
    // Questions about facts
    'what is', 'who is', 'where is', 'when is', 'how many', 'how much',
    'what are', 'who are', 'tell me about', 'explain',
    
    // Research queries
    'find', 'search', 'look up', 'check', 'verify',
    
    // News and trends
    'news', 'update', 'announcement', 'release',
    
    // Comparisons
    'compare', 'difference between', 'vs', 'versus',
    
    // Specific domains that often need web data
    'price', 'stock', 'weather', 'schedule', 'event',
  ]
  
  // Check if message contains any search indicators
  const needsSearch = searchIndicators.some(indicator => 
    lowerMessage.includes(indicator)
  )
  
  // Also check if it's a question (ends with ?)
  const isQuestion = message.trim().endsWith('?')
  
  // Search if it has indicators OR is a factual question
  return needsSearch || (isQuestion && message.length > 20)
}

// Extract search query from user message
export function extractSearchQuery(message: string): string {
  let query = message
  
  // Remove common conversational parts
  const conversationalPhrases = [
    'can you',
    'could you',
    'please',
    'i want to know',
    'tell me',
    'explain to me',
    'help me understand',
    'what do you think about',
  ]
  
  let cleanQuery = query.toLowerCase()
  conversationalPhrases.forEach(phrase => {
    cleanQuery = cleanQuery.replace(phrase, '')
  })
  
  // Remove question marks and clean up
  cleanQuery = cleanQuery.replace(/\?/g, '').trim()
  
  // If query is too short, use original message
  if (cleanQuery.length < 10) {
    cleanQuery = message.replace(/\?/g, '').trim()
  }
  
  // Limit length
  if (cleanQuery.length > 200) {
    cleanQuery = cleanQuery.substring(0, 200)
  }
  
  return cleanQuery
}

// Perform automatic search based on user message
export async function autoSearch(message: string): Promise<{
  shouldSearch: boolean
  query?: string
  results?: SearchResponse
  error?: string
}> {
  // Check if search is needed
  if (!shouldSearchWeb(message)) {
    return { shouldSearch: false }
  }
  
  // Extract search query
  const query = extractSearchQuery(message)
  
  try {
    // Get browser settings
    const browserType = (localStorage.getItem('search_browser_type') as BrowserType) || 'api-only'
    const headlessMode = localStorage.getItem('search_headless') !== 'false'
    const undetectedMode = localStorage.getItem('search_undetected') !== 'false'
    
    let results: SearchResponse
    
    // Use browser automation if enabled
    if (browserType !== 'api-only') {
      try {
        const browserResults = await searchWithBrowser(query, {
          browserType,
          headless: headlessMode,
          useUndetected: undetectedMode,
        })
        
        // Convert browser results to SearchResponse format
        results = {
          query,
          results: browserResults.map(result => ({
            title: result.title,
            url: result.url,
            snippet: result.snippet,
            source: 'browser',
          })),
          timestamp: new Date().toISOString(),
        }
      } catch (browserError) {
        console.error('Browser search failed, falling back to API:', browserError)
        // Fallback to API search
        results = await webSearch(query)
      }
    } else {
      // Use API search
      results = await webSearch(query)
    }
    
    return {
      shouldSearch: true,
      query,
      results,
    }
  } catch (error) {
    console.error('Auto-search error:', error)
    return {
      shouldSearch: true,
      query,
      error: 'Failed to perform web search',
    }
  }
}

// Format auto-search results for context
export function formatAutoSearchContext(
  userMessage: string,
  searchResults: SearchResponse
): string {
  let context = `User asked: "${userMessage}"\n\n`
  context += `Automatic web search performed for: "${searchResults.query}"\n\n`
  context += formatSearchResults(searchResults)
  context += '\nPlease answer the user\'s question using these search results as context.\n'
  
  return context
}

