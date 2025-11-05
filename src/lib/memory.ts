export interface Memory {
  id: string
  content: string
  category: 'user_info' | 'preference' | 'fact' | 'context'
  created_at: string
  updated_at: string
  importance: 'low' | 'medium' | 'high'
}

export interface MemoryStorage {
  memories: Memory[]
  lastUpdated: string
}

const MEMORY_STORAGE_KEY = 'symchat_memories'

// Get all memories
export function getMemories(): Memory[] {
  try {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY)
    if (!stored) return []
    const data: MemoryStorage = JSON.parse(stored)
    return data.memories || []
  } catch (error) {
    console.error('Failed to load memories:', error)
    return []
  }
}

// Save memories to localStorage
function saveMemoriesToStorage(memories: Memory[]): void {
  const data: MemoryStorage = {
    memories,
    lastUpdated: new Date().toISOString(),
  }
  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(data))
}

// Add a new memory
export function addMemory(
  content: string,
  category: Memory['category'] = 'fact',
  importance: Memory['importance'] = 'medium'
): Memory {
  const memories = getMemories()
  const newMemory: Memory = {
    id: Date.now().toString(),
    content,
    category,
    importance,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  memories.push(newMemory)
  saveMemoriesToStorage(memories)
  return newMemory
}

// Update an existing memory
export function updateMemory(id: string, updates: Partial<Memory>): Memory | null {
  const memories = getMemories()
  const index = memories.findIndex((m) => m.id === id)
  
  if (index === -1) return null
  
  memories[index] = {
    ...memories[index],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  
  saveMemoriesToStorage(memories)
  return memories[index]
}

// Delete a memory
export function deleteMemory(id: string): boolean {
  const memories = getMemories()
  const filtered = memories.filter((m) => m.id !== id)
  
  if (filtered.length === memories.length) return false
  
  saveMemoriesToStorage(filtered)
  return true
}

// Get memories by category
export function getMemoriesByCategory(category: Memory['category']): Memory[] {
  return getMemories().filter((m) => m.category === category)
}

// Get memories by importance
export function getMemoriesByImportance(importance: Memory['importance']): Memory[] {
  return getMemories().filter((m) => m.importance === importance)
}

// Clear all memories
export function clearAllMemories(): void {
  localStorage.removeItem(MEMORY_STORAGE_KEY)
}

// Get memory context for AI (formatted for prompt)
export function getMemoryContext(): string {
  const memories = getMemories()
  
  if (memories.length === 0) {
    return ''
  }
  
  // Sort by importance and date
  const sortedMemories = memories.sort((a, b) => {
    const importanceWeight = { high: 3, medium: 2, low: 1 }
    const diff = importanceWeight[b.importance] - importanceWeight[a.importance]
    if (diff !== 0) return diff
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
  
  // Group by category
  const userInfo = sortedMemories.filter((m) => m.category === 'user_info')
  const preferences = sortedMemories.filter((m) => m.category === 'preference')
  const facts = sortedMemories.filter((m) => m.category === 'fact')
  const context = sortedMemories.filter((m) => m.category === 'context')
  
  let memoryText = 'Previous conversation context and memories:\n\n'
  
  if (userInfo.length > 0) {
    memoryText += '## User Information:\n'
    userInfo.forEach((m) => memoryText += `- ${m.content}\n`)
    memoryText += '\n'
  }
  
  if (preferences.length > 0) {
    memoryText += '## User Preferences:\n'
    preferences.forEach((m) => memoryText += `- ${m.content}\n`)
    memoryText += '\n'
  }
  
  if (facts.length > 0) {
    memoryText += '## Important Facts:\n'
    facts.forEach((m) => memoryText += `- ${m.content}\n`)
    memoryText += '\n'
  }
  
  if (context.length > 0) {
    memoryText += '## Context:\n'
    context.forEach((m) => memoryText += `- ${m.content}\n`)
    memoryText += '\n'
  }
  
  return memoryText
}

// Extract potential memories from conversation
export function suggestMemoriesFromConversation(
  userMessage: string,
  _assistantResponse: string
): string[] {
  const suggestions: string[] = []
  
  // Simple pattern matching for common memory triggers
  const userLower = userMessage.toLowerCase()
  
  // Name detection
  if (userLower.includes('my name is') || userLower.includes("i'm ") || userLower.includes("i am ")) {
    suggestions.push(`User mentioned: ${userMessage}`)
  }
  
  // Preference detection
  if (userLower.includes('i like') || userLower.includes('i love') || userLower.includes('i prefer')) {
    suggestions.push(`Preference: ${userMessage}`)
  }
  
  // Location/occupation detection
  if (userLower.includes('i live in') || userLower.includes('i work as') || userLower.includes('i am a')) {
    suggestions.push(`User info: ${userMessage}`)
  }
  
  return suggestions
}
