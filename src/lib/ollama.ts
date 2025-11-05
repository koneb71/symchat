const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434'

export interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
  details?: {
    format?: string
    family?: string
    families?: string[]
    parameter_size?: string
    quantization_level?: string
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[] // Base64 encoded images for display
  files?: Array<{ name: string; type: string; typeName: string; size: number }> // Attached files metadata
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  images?: string[] // Base64 encoded images for vision models
  signal?: AbortSignal
  options?: {
    temperature?: number
    num_predict?: number // max tokens
    top_p?: number
    top_k?: number
    repeat_penalty?: number
  }
}

export interface ChatResponse {
  model: string
  created_at: string
  message: ChatMessage
  done: boolean
}

export async function listModels(): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`)
    const data = await response.json()
    return data.models || []
  } catch (error) {
    console.error('Failed to fetch models:', error)
    return []
  }
}

export async function* chatStream(request: ChatRequest): AsyncGenerator<string> {
  const { signal, options, ...requestBody } = request
  
  // Build the request with options
  const body: any = {
    ...requestBody,
    stream: true,
  }
  
  // Add options if provided
  if (options) {
    body.options = options
  }
  
  const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No reader available')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line) as ChatResponse
            if (json.message?.content) {
              yield json.message.content
            }
          } catch (e) {
            console.error('Failed to parse JSON:', e)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function chat(request: ChatRequest): Promise<string> {
  let fullResponse = ''
  for await (const chunk of chatStream(request)) {
    fullResponse += chunk
  }
  return fullResponse
}

export async function pullModel(
  modelName: string,
  onProgress?: (progress: { status: string; completed?: number; total?: number }) => void
): Promise<void> {
  const response = await fetch(`${OLLAMA_API_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: true }),
  })

  if (!response.ok) {
    throw new Error(`Failed to pull model: ${response.statusText}`)
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

export async function deleteModel(modelName: string): Promise<void> {
  const response = await fetch(`${OLLAMA_API_URL}/api/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
  })

  if (!response.ok) {
    throw new Error(`Failed to delete model: ${response.statusText}`)
  }
}

export async function showModelInfo(modelName: string): Promise<any> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get model info: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to get model info:', error)
    return null
  }
}
