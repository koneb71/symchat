import { webSearch } from "./web-search";
import type { SearchResponse, SearchResult } from "./web-search";
import { searchCache } from "./search-cache";

export interface ResearchStep {
  id: string;
  query: string;
  status: "pending" | "searching" | "completed" | "failed";
  results?: SearchResponse;
  error?: string;
}

export interface ResearchProgress {
  currentStep: number;
  totalSteps: number;
  steps: ResearchStep[];
  status: "planning" | "researching" | "synthesizing" | "completed" | "failed";
  finalReport?: string;
}

// Generate research sub-queries from main query
export function generateResearchQueries(mainQuery: string): string[] {
  const queries: string[] = [];
  const lowerQuery = mainQuery.toLowerCase();

  // Main query
  queries.push(mainQuery);

  // Determine query type and add relevant sub-queries
  const isPersonQuery =
    lowerQuery.includes("who is") ||
    /\b(person|people|ceo|founder|author|artist|scientist)\b/i.test(mainQuery);
  const isProductQuery =
    /\b(review|product|service|app|software|tool|device)\b/i.test(mainQuery);
  const isComparison =
    /\b(vs|versus|compare|difference between|better than)\b/i.test(mainQuery);
  const isHowTo =
    lowerQuery.includes("how to") || lowerQuery.includes("how do");

  if (isPersonQuery) {
    queries.push(`${mainQuery} biography and background`);
    queries.push(`${mainQuery} achievements and contributions`);
    queries.push(`${mainQuery} latest news`);
  } else if (isProductQuery) {
    queries.push(`${mainQuery} review and ratings`);
    queries.push(`${mainQuery} features and specifications`);
    queries.push(`${mainQuery} pros and cons`);
    queries.push(`${mainQuery} alternatives and competitors`);
  } else if (isComparison) {
    queries.push(`${mainQuery} detailed comparison`);
    queries.push(`${mainQuery} which is better`);
    queries.push(`${mainQuery} user experiences`);
  } else if (isHowTo) {
    queries.push(`${mainQuery} step by step guide`);
    queries.push(`${mainQuery} tutorial`);
    queries.push(`${mainQuery} best practices`);
  } else {
    // General research queries
    queries.push(`${mainQuery} comprehensive overview`);
    queries.push(
      `${mainQuery} latest developments ${new Date().getFullYear()}`
    );
    queries.push(`${mainQuery} expert analysis and insights`);
    queries.push(`${mainQuery} statistics and data`);
    queries.push(`${mainQuery} real world examples and use cases`);
  }

  // Add current year for time-sensitive topics
  if (
    lowerQuery.includes("latest") ||
    lowerQuery.includes("recent") ||
    lowerQuery.includes("current")
  ) {
    queries.push(`${mainQuery} ${new Date().getFullYear()}`);
  }

  // Limit to 6-8 queries for efficiency
  return queries.slice(0, 8);
}

// Deduplicate search results based on URL similarity
function deduplicateResults(allResults: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const unique: SearchResult[] = [];

  for (const result of allResults) {
    // Normalize URL (remove query params and hash for comparison)
    const normalizedUrl = result.url.split("?")[0].split("#")[0].toLowerCase();

    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      unique.push(result);
    }
  }

  return unique;
}

// Score and rank results by relevance
function rankResults(
  results: SearchResult[],
  mainQuery: string
): SearchResult[] {
  const queryTerms = mainQuery.toLowerCase().split(/\s+/);

  return results
    .map((result) => {
      let score = 0;
      const title = (result.title || "").toLowerCase();
      const snippet = (result.snippet || "").toLowerCase();

      // Score based on query term matches
      queryTerms.forEach((term) => {
        if (term.length < 3) return; // Skip short words

        // Title matches are more valuable
        if (title.includes(term)) score += 3;
        // Snippet matches
        if (snippet.includes(term)) score += 1;
      });

      // Bonus for having more content
      if (snippet && snippet.length > 100) score += 1;

      // Bonus for certain trusted domains
      const trustedDomains = [
        "wikipedia.org",
        "github.com",
        ".edu",
        ".gov",
        "stackoverflow.com",
      ];
      if (trustedDomains.some((domain) => result.url.includes(domain))) {
        score += 2;
      }

      return { ...result, relevanceScore: score };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

// Perform deep research with multiple searches
export async function performDeepResearch(
  mainQuery: string,
  onProgress: (progress: ResearchProgress) => void
): Promise<ResearchProgress> {
  // Generate research plan
  const queries = generateResearchQueries(mainQuery);
  const steps: ResearchStep[] = queries.map((query, index) => ({
    id: `step-${index}`,
    query,
    status: "pending" as const,
  }));

  const progress: ResearchProgress = {
    currentStep: 0,
    totalSteps: steps.length,
    steps,
    status: "planning",
  };

  onProgress({ ...progress });

  // Start researching
  progress.status = "researching";
  onProgress({ ...progress });

  // Perform searches in parallel (batches of 3 to avoid overwhelming)
  const batchSize = 3;
  for (let i = 0; i < steps.length; i += batchSize) {
    const batch = steps.slice(i, i + batchSize);

    // Update all batch steps to searching
    batch.forEach((step) => {
      step.status = "searching";
    });
    onProgress({ ...progress });

    // Execute searches in parallel for this batch
    await Promise.all(
      batch.map(async (step, batchIndex) => {
        progress.currentStep = i + batchIndex + 1;

        try {
          // Check cache first
          let results = searchCache.get(step.query);

          if (!results) {
            // Perform web search with timeout
            results = await Promise.race([
              webSearch(step.query),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Search timeout")), 20000)
              ),
            ]);

            // Cache the results
            searchCache.set(step.query, results);
          }

          step.results = results;

          if (results.results.length === 0) {
            step.status = "failed";
            step.error = "No results found";
          } else {
            step.status = "completed";
          }
        } catch (error: any) {
          console.error(`Research step ${i + batchIndex + 1} failed:`, error);
          step.status = "failed";
          step.error = error.message || "Search failed";
        }

        onProgress({ ...progress });
      })
    );

    // Small delay between batches
    if (i + batchSize < steps.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Check if we have any successful results
  const successfulSteps = steps.filter(
    (s) => s.status === "completed" && s.results
  );

  if (successfulSteps.length === 0) {
    progress.status = "failed";
    progress.finalReport =
      "⚠️ Deep research failed: No search results could be gathered. This might be due to network issues or CORS restrictions. Please try again or use the manual Deep Research tool from Settings.";
    onProgress({ ...progress });
    return progress;
  }

  // Synthesize results
  progress.status = "synthesizing";
  onProgress({ ...progress });

  // Collect all results
  const allResults: SearchResult[] = [];
  successfulSteps.forEach((step) => {
    if (step.results?.results) {
      allResults.push(...step.results.results);
    }
  });

  // Deduplicate and rank results
  const uniqueResults = deduplicateResults(allResults);
  const rankedResults = rankResults(uniqueResults, mainQuery);

  // Format final report with ranked results
  progress.finalReport = formatResearchReport(
    mainQuery,
    steps,
    rankedResults.slice(0, 20)
  );
  progress.status = "completed";
  onProgress({ ...progress });

  return progress;
}

// Format research results into a comprehensive report
function formatResearchReport(
  mainQuery: string,
  steps: ResearchStep[],
  topResults: SearchResult[]
): string {
  let report = `# Deep Research Report: ${mainQuery}\n\n`;

  const successfulSteps = steps.filter(
    (s) => s.status === "completed" && s.results
  );

  if (successfulSteps.length === 0) {
    report += "⚠️ No research data could be gathered.\n";
    return report;
  }

  const totalSources = successfulSteps.reduce(
    (sum, s) => sum + (s.results?.results.length || 0),
    0
  );

  report += `## Executive Summary\n\n`;
  report += `Conducted comprehensive research across ${successfulSteps.length} different research angles. `;
  report += `Analyzed ${totalSources} sources and identified the ${topResults.length} most relevant findings.\n\n`;

  // Add key findings from top-ranked results
  report += `## Key Findings (Ranked by Relevance)\n\n`;
  topResults.forEach((result, index) => {
    report += `### ${index + 1}. ${result.title}\n`;
    report += `**Source:** ${result.url}\n`;
    if ((result as any).relevanceScore) {
      report += `**Relevance Score:** ${(result as any).relevanceScore}\n`;
    }
    report += `\n`;
    if (result.snippet) {
      report += `${result.snippet}\n`;
    }
    report += `\n---\n\n`;
  });

  // Add research breakdown by query
  report += `## Research Breakdown\n\n`;
  successfulSteps.forEach((step, index) => {
    const resultCount = step.results?.results.length || 0;
    report += `**${index + 1}. ${
      step.query
    }** - ${resultCount} sources found\n`;
  });
  report += `\n`;

  // Add all unique sources
  report += `## All Sources (${topResults.length})\n\n`;
  topResults.forEach((result, index) => {
    report += `${index + 1}. [${result.title}](${result.url})\n`;
  });

  return report;
}

// Format research context for AI
export function formatResearchContext(progress: ResearchProgress): string {
  if (progress.status !== "completed" || !progress.finalReport) {
    return "";
  }

  return `\n\n=== Deep Research Results ===\n\n${progress.finalReport}\n\n===\n\nPlease analyze the above research findings and provide insights based on this comprehensive information.\n\n`;
}
