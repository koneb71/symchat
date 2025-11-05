// Memory operations using IndexedDB via Dexie
import { DatabaseService } from './database'
import type { Memory } from './database'

// Get all memories
export async function getMemories(): Promise<Memory[]> {
  return await DatabaseService.getMemories()
}

// Add a new memory
export async function addMemory(
  content: string,
  category: Memory['category'] = 'fact',
  importance: Memory['importance'] = 'medium'
): Promise<Memory> {
  const newMemory: Omit<Memory, 'id'> = {
    content,
    category,
    importance,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  const id = await DatabaseService.addMemory(newMemory)
  return { ...newMemory, id }
}

// Update an existing memory
export async function updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
  try {
    await DatabaseService.updateMemory(id, updates)
    const memories = await getMemories()
    return memories.find(m => m.id === id) || null
  } catch (error) {
    console.error('Failed to update memory:', error)
    return null
  }
}

// Delete a memory
export async function deleteMemory(id: string): Promise<boolean> {
  try {
    await DatabaseService.deleteMemory(id)
    return true
  } catch (error) {
    console.error('Failed to delete memory:', error)
    return false
  }
}

// Get memories by category
export async function getMemoriesByCategory(category: Memory['category']): Promise<Memory[]> {
  return await DatabaseService.getMemoriesByCategory(category)
}

// Get memories by importance
export async function getMemoriesByImportance(importance: Memory['importance']): Promise<Memory[]> {
  return await DatabaseService.getMemoriesByImportance(importance)
}

// Clear all memories
export async function clearAllMemories(): Promise<void> {
  await DatabaseService.clearAllMemories()
}

// Get memory context for AI (formatted for prompt)
export async function getMemoryContext(): Promise<string> {
  const memories = await getMemories()
  
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

// Export type for compatibility
export type { Memory }

