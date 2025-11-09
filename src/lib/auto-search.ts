// Automatic web search - analyze user input and decide if/what to search

import {
  webSearch,
  formatSearchResults,
  type SearchResponse,
} from "./web-search";
import { searchWithBrowser, type BrowserType } from "./browser-search";
import { searchCache } from "./search-cache";

// Determine if a user message needs web search
export function shouldSearchWeb(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Keywords that suggest need for web search
  const searchIndicators = [
    // Questions about current/recent information
    "latest",
    "recent",
    "current",
    "today",
    "now",
    "this year",
    "this month",
    "2024",
    "2025",
    "2026",
    "right now",
    "at the moment",
    "currently",

    // Questions about facts
    "what is",
    "who is",
    "where is",
    "when is",
    "how many",
    "how much",
    "what are",
    "who are",
    "tell me about",
    "explain",
    "define",
    "what does",
    "which is",
    "which are",
    "why is",
    "why are",

    // Research queries
    "find",
    "search",
    "look up",
    "check",
    "verify",
    "research",
    "investigate",
    "discover",
    "explore",
    "learn about",

    // News and trends
    "news",
    "update",
    "announcement",
    "release",
    "breaking",
    "headline",
    "report",
    "article",
    "trending",
    "viral",

    // Comparisons
    "compare",
    "difference between",
    "vs",
    "versus",
    "better than",
    "best",
    "top",
    "review",
    "comparison",

    // Specific domains that often need web data
    "price",
    "cost",
    "stock",
    "weather",
    "forecast",
    "schedule",
    "event",
    "ticket",
    "availability",
    "status",
    "rating",
    "ranking",

    // Technical and specific info
    "version",
    "release date",
    "official",
    "documentation",
    "guide",
    "tutorial",
    "how to",
    "step by step",
    "instructions",

    // Statistics and data
    "statistics",
    "data",
    "number",
    "percentage",
    "rate",
    "average",
    "total",
    "count",
    "survey",
    "study",
    "research shows",
  ];

  // Check if message contains any search indicators
  const needsSearch = searchIndicators.some((indicator) =>
    lowerMessage.includes(indicator)
  );

  // Check for question patterns
  const questionWords = ["what", "who", "where", "when", "why", "how", "which"];
  const startsWithQuestion = questionWords.some((word) =>
    lowerMessage.startsWith(word + " ")
  );
  const isQuestion = message.trim().endsWith("?");

  // Check for real-time/temporal context
  const temporalIndicators = [
    "right now",
    "today",
    "currently",
    "latest",
    "recent",
  ];
  const needsRealtime = temporalIndicators.some((indicator) =>
    lowerMessage.includes(indicator)
  );

  // Search if:
  // - Has search indicators
  // - Is a substantial question (starts with question word or ends with ?)
  // - Needs real-time information
  return (
    needsSearch ||
    (startsWithQuestion && message.length > 15) ||
    (isQuestion && message.length > 20) ||
    needsRealtime
  );
}

// Extract search query from user message
export function extractSearchQuery(message: string): string {
  let query = message.trim();

  // Remove common conversational parts (case-insensitive)
  const conversationalPhrases = [
    "can you",
    "could you",
    "would you",
    "please",
    "i want to know",
    "i need to know",
    "i'd like to know",
    "tell me",
    "explain to me",
    "show me",
    "help me understand",
    "help me find",
    "help me with",
    "what do you think about",
    "what are your thoughts on",
    "i was wondering",
    "i'm curious about",
    "do you know",
    "can you find",
    "can you search for",
  ];

  let cleanQuery = query;
  conversationalPhrases.forEach((phrase) => {
    const regex = new RegExp(phrase, "gi");
    cleanQuery = cleanQuery.replace(regex, "");
  });

  // Remove question marks and extra punctuation
  cleanQuery = cleanQuery.replace(/[?!]+$/g, "").trim();

  // Remove leading articles and common words
  cleanQuery = cleanQuery.replace(/^(the|a|an)\s+/i, "");

  // If query became too short, try to extract key terms from original
  if (cleanQuery.length < 10) {
    // Extract content after question words
    const questionMatch = message.match(
      /(?:what|who|where|when|why|how|which)\s+(.+?)(?:\?|$)/i
    );
    if (questionMatch && questionMatch[1]) {
      cleanQuery = questionMatch[1].trim();
    } else {
      // Use original message without punctuation
      cleanQuery = message.replace(/[?!.]+$/g, "").trim();
    }
  }

  // Remove redundant spaces
  cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();

  // Limit length but try to end at word boundary
  if (cleanQuery.length > 200) {
    cleanQuery = cleanQuery.substring(0, 200);
    const lastSpace = cleanQuery.lastIndexOf(" ");
    if (lastSpace > 150) {
      cleanQuery = cleanQuery.substring(0, lastSpace);
    }
  }

  return cleanQuery || message.replace(/[?!.]+$/g, "").trim();
}

// Perform automatic search based on user message
export async function autoSearch(message: string): Promise<{
  shouldSearch: boolean;
  query?: string;
  results?: SearchResponse;
  error?: string;
}> {
  // Check if search is needed
  if (!shouldSearchWeb(message)) {
    return { shouldSearch: false };
  }

  // Extract search query
  const query = extractSearchQuery(message);

  // Check cache first
  const cachedResults = searchCache.get(query);
  if (cachedResults) {
    return {
      shouldSearch: true,
      query,
      results: cachedResults,
    };
  }

  try {
    // Get browser settings
    const browserType =
      (localStorage.getItem("search_browser_type") as BrowserType) ||
      "api-only";
    const headlessMode = localStorage.getItem("search_headless") !== "false";
    const undetectedMode =
      localStorage.getItem("search_undetected") !== "false";

    let results: SearchResponse;

    // Use browser automation if enabled
    if (browserType !== "api-only") {
      try {
        const browserResults = await searchWithBrowser(query, {
          browserType,
          headless: headlessMode,
          useUndetected: undetectedMode,
        });

        // Convert browser results to SearchResponse format
        results = {
          query,
          results: browserResults.map((result) => ({
            title: result.title,
            url: result.url,
            snippet: result.snippet,
            source: "browser",
          })),
          timestamp: new Date().toISOString(),
        };
      } catch (browserError) {
        console.error(
          "Browser search failed, falling back to API:",
          browserError
        );
        // Fallback to API search
        results = await webSearch(query);
      }
    } else {
      // Use API search
      results = await webSearch(query);
    }

    // Cache the results
    searchCache.set(query, results);

    return {
      shouldSearch: true,
      query,
      results,
    };
  } catch (error) {
    console.error("Auto-search error:", error);
    return {
      shouldSearch: true,
      query,
      error: "Failed to perform web search",
    };
  }
}

// Format auto-search results for context
export function formatAutoSearchContext(
  userMessage: string,
  searchResults: SearchResponse
): string {
  let context = `User asked: "${userMessage}"\n\n`;
  context += `Automatic web search performed for: "${searchResults.query}"\n\n`;
  context += formatSearchResults(searchResults);
  context +=
    "\nPlease answer the user's question using these search results as context.\n";

  return context;
}
