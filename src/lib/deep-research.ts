import { webSearch } from './web-search'
import type { SearchResponse } from './web-search'

export interface ResearchStep {
  id: string
  query: string
  status: 'pending' | 'searching' | 'completed' | 'failed'
  results?: SearchResponse
  error?: string
}

export interface ResearchProgress {
  currentStep: number
  totalSteps: number
  steps: ResearchStep[]
  status: 'planning' | 'researching' | 'synthesizing' | 'completed' | 'failed'
  finalReport?: string
}

// Generate research sub-queries from main query
export function generateResearchQueries(mainQuery: string): string[] {
  const queries: string[] = []
  
  // Main query
  queries.push(mainQuery)
  
  // Add context queries
  queries.push(`${mainQuery} overview and background`)
  queries.push(`${mainQuery} latest developments and news`)
  queries.push(`${mainQuery} expert analysis and opinions`)
  queries.push(`${mainQuery} statistics and data`)
  
  return queries
}

// Perform deep research with multiple searches
export async function performDeepResearch(
  mainQuery: string,
  onProgress: (progress: ResearchProgress) => void
): Promise<ResearchProgress> {
  
  // Generate research plan
  const queries = generateResearchQueries(mainQuery)
  const steps: ResearchStep[] = queries.map((query, index) => ({
    id: `step-${index}`,
    query,
    status: 'pending' as const,
  }))
  
  const progress: ResearchProgress = {
    currentStep: 0,
    totalSteps: steps.length,
    steps,
    status: 'planning',
  }
  
  onProgress({ ...progress })
  
  // Start researching
  progress.status = 'researching'
  onProgress({ ...progress })
  
  // Perform searches sequentially
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    progress.currentStep = i + 1
    
    step.status = 'searching'
    onProgress({ ...progress })
    
    try {
      // Perform web search with timeout
      const results = await Promise.race([
        webSearch(step.query),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), 15000)
        )
      ])
      
      step.results = results
      
      // Mark as completed even if no results (better than failing)
      if (results.results.length === 0) {
        step.status = 'failed'
        step.error = 'No results found'
      } else {
        step.status = 'completed'
      }
      
      // Delay between searches to avoid rate limiting
      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error: any) {
      console.error(`Research step ${i + 1} failed:`, error)
      step.status = 'failed'
      step.error = error.message || 'Search failed'
    }
    
    onProgress({ ...progress })
  }
  
  // Check if we have any successful results
  const successfulSteps = steps.filter(s => s.status === 'completed' && s.results)
  
  if (successfulSteps.length === 0) {
    progress.status = 'failed'
    progress.finalReport = '⚠️ Deep research failed: No search results could be gathered. This might be due to network issues or CORS restrictions. Please try again or use the manual Deep Research tool from Settings.'
    onProgress({ ...progress })
    return progress
  }
  
  // Synthesize results
  progress.status = 'synthesizing'
  onProgress({ ...progress })
  
  // Format final report
  progress.finalReport = formatResearchReport(mainQuery, steps)
  progress.status = 'completed'
  onProgress({ ...progress })
  
  return progress
}

// Format research results into a comprehensive report
function formatResearchReport(mainQuery: string, steps: ResearchStep[]): string {
  let report = `# Deep Research Report: ${mainQuery}\n\n`
  
  const successfulSteps = steps.filter(s => s.status === 'completed' && s.results)
  
  if (successfulSteps.length === 0) {
    report += '⚠️ No research data could be gathered.\n'
    return report
  }
  
  report += `## Executive Summary\n\n`
  report += `Conducted comprehensive research across ${successfulSteps.length} different angles. `
  report += `Gathered information from ${successfulSteps.reduce((sum, s) => sum + (s.results?.results.length || 0), 0)} sources.\n\n`
  
  // Add findings from each research step
  successfulSteps.forEach((step, index) => {
    report += `## ${index + 1}. ${step.query}\n\n`
    
    if (step.results && step.results.results.length > 0) {
      step.results.results.forEach((result, resultIndex) => {
        report += `### ${resultIndex + 1}. ${result.title}\n`
        report += `**Source:** ${result.url}\n\n`
        if (result.snippet) {
          report += `${result.snippet}\n\n`
        }
      })
    }
    
    report += `---\n\n`
  })
  
  // Add sources section
  report += `## All Sources\n\n`
  const allSources = new Set<string>()
  successfulSteps.forEach(step => {
    step.results?.results.forEach(result => {
      allSources.add(`- [${result.title}](${result.url})`)
    })
  })
  report += Array.from(allSources).join('\n')
  
  return report
}

// Format research context for AI
export function formatResearchContext(progress: ResearchProgress): string {
  if (progress.status !== 'completed' || !progress.finalReport) {
    return ''
  }
  
  return `\n\n=== Deep Research Results ===\n\n${progress.finalReport}\n\n===\n\nPlease analyze the above research findings and provide insights based on this comprehensive information.\n\n`
}

