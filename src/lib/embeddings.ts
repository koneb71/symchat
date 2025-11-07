const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434'

// Default embedding model - lightweight and fast
const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text'

export interface EmbeddingResult {
  embedding: number[]
}

/**
 * Generate embeddings for text using Ollama
 */
export async function generateEmbedding(
  text: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding generation failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    throw error
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}

/**
 * Find top K most similar texts to a query using embeddings
 */
export async function findSimilarTexts(
  query: string,
  texts: Array<{ text: string; embedding?: number[] }>,
  topK: number = 5,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<Array<{ text: string; similarity: number; index: number }>> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query, model)

  // Calculate similarities
  const results = texts.map((item, index) => {
    if (!item.embedding) {
      throw new Error(`Text at index ${index} does not have an embedding`)
    }

    const similarity = cosineSimilarity(queryEmbedding, item.embedding)
    return {
      text: item.text,
      similarity,
      index,
    }
  })

  // Sort by similarity (descending) and return top K
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
}

/**
 * Check if embedding model is available
 */
export async function isEmbeddingModelAvailable(
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`)
    const data = await response.json()
    const models = data.models || []
    return models.some((m: any) => m.name === model || m.name.startsWith(model + ':'))
  } catch (error) {
    console.error('Failed to check embedding model availability:', error)
    return false
  }
}

/**
 * Pull embedding model if not available
 */
export async function ensureEmbeddingModel(
  model: string = DEFAULT_EMBEDDING_MODEL,
  onProgress?: (progress: { status: string; completed?: number; total?: number }) => void
): Promise<void> {
  const available = await isEmbeddingModelAvailable(model)
  if (available) {
    return
  }

  // Pull the model
  const response = await fetch(`${OLLAMA_API_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: model, stream: true }),
  })

  if (!response.ok) {
    throw new Error(`Failed to pull embedding model: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line)
          if (onProgress) {
            onProgress({
              status: data.status || '',
              completed: data.completed,
              total: data.total,
            })
          }
        } catch (e) {
          console.error('Failed to parse progress:', e)
        }
      }
    }
  }
}

export { DEFAULT_EMBEDDING_MODEL }

