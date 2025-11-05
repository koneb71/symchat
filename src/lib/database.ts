import Dexie, { Table } from 'dexie'

// Database types
export interface Conversation {
  id?: string
  title: string
  model: string
  created_at: string
  updated_at: string
}

export interface Message {
  id?: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[] // Base64 encoded images
  files?: AttachedFile[] // Attached documents metadata
  created_at: string
}

export interface AttachedFile {
  name: string
  type: string
  typeName: string
  size: number
}

export interface Memory {
  id?: string
  content: string
  category: 'user_info' | 'preference' | 'fact' | 'context'
  importance: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export interface Settings {
  id?: string
  key: string
  value: string
}

export interface Document {
  id?: string
  name: string
  text: string
  pageCount: number
  size: number
  uploadedAt: string
}

export interface DocumentChunk {
  id?: string
  documentId: string
  text: string
  pageNumber: number
  chunkIndex: number
}

// Dexie Database class
export class SymChatDatabase extends Dexie {
  conversations!: Table<Conversation>
  messages!: Table<Message>
  memories!: Table<Memory>
  settings!: Table<Settings>
  documents!: Table<Document>
  documentChunks!: Table<DocumentChunk>

  constructor() {
    super('SymChatDB')
    
    // Version 1: Initial schema
    this.version(1).stores({
      conversations: '++id, title, model, updated_at',
      messages: '++id, conversation_id, created_at',
      memories: '++id, category, importance, updated_at',
      settings: '++id, key',
    })
    
    // Version 2: Add images support to messages
    this.version(2).stores({
      conversations: '++id, title, model, updated_at',
      messages: '++id, conversation_id, created_at',
      memories: '++id, category, importance, updated_at',
      settings: '++id, key',
    })
    
    // Version 3: Add documents and chunks for RAG
    this.version(3).stores({
      conversations: '++id, title, model, updated_at',
      messages: '++id, conversation_id, created_at',
      memories: '++id, category, importance, updated_at',
      settings: '++id, key',
      documents: '++id, name, uploadedAt',
      documentChunks: '++id, documentId, chunkIndex',
    })
    
    // Version 4: Add files support to messages
    this.version(4).stores({
      conversations: '++id, title, model, updated_at',
      messages: '++id, conversation_id, created_at',
      memories: '++id, category, importance, updated_at',
      settings: '++id, key',
      documents: '++id, name, uploadedAt',
      documentChunks: '++id, documentId, chunkIndex',
    })
  }
}

// Create a single database instance
export const db = new SymChatDatabase()

// Database operations
export class DatabaseService {
  // ============ Conversations ============
  
  static async getConversations(): Promise<Conversation[]> {
    return await db.conversations.orderBy('updated_at').reverse().toArray()
  }

  static async getConversation(id: string): Promise<Conversation | undefined> {
    return await db.conversations.get(id)
  }

  static async createConversation(conversation: Omit<Conversation, 'id'>): Promise<string> {
    const id = await db.conversations.add(conversation as Conversation)
    return String(id)
  }

  static async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    await db.conversations.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    })
  }

  static async deleteConversation(id: string): Promise<void> {
    // Delete conversation and all its messages
    await db.messages.where('conversation_id').equals(id).delete()
    await db.conversations.delete(id)
  }

  // ============ Messages ============

  static async getMessages(conversationId: string): Promise<Message[]> {
    return await db.messages
      .where('conversation_id')
      .equals(conversationId)
      .sortBy('created_at')
  }

  static async addMessage(message: Omit<Message, 'id'>): Promise<string> {
    const id = await db.messages.add(message as Message)
    return String(id)
  }

  static async deleteMessages(conversationId: string): Promise<void> {
    await db.messages.where('conversation_id').equals(conversationId).delete()
  }

  // ============ Memories ============

  static async getMemories(): Promise<Memory[]> {
    return await db.memories.toArray()
  }

  static async getMemoriesByCategory(category: Memory['category']): Promise<Memory[]> {
    return await db.memories.where('category').equals(category).toArray()
  }

  static async getMemoriesByImportance(importance: Memory['importance']): Promise<Memory[]> {
    return await db.memories.where('importance').equals(importance).toArray()
  }

  static async addMemory(memory: Omit<Memory, 'id'>): Promise<string> {
    const id = await db.memories.add(memory as Memory)
    return String(id)
  }

  static async updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
    await db.memories.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    })
  }

  static async deleteMemory(id: string): Promise<void> {
    await db.memories.delete(id)
  }

  static async clearAllMemories(): Promise<void> {
    await db.memories.clear()
  }

  // ============ Settings ============

  static async getSetting(key: string): Promise<string | undefined> {
    const setting = await db.settings.where('key').equals(key).first()
    return setting?.value
  }

  static async setSetting(key: string, value: string): Promise<void> {
    const existing = await db.settings.where('key').equals(key).first()
    if (existing && existing.id) {
      await db.settings.update(existing.id, { value })
    } else {
      await db.settings.add({ key, value })
    }
  }

  static async deleteSetting(key: string): Promise<void> {
    const setting = await db.settings.where('key').equals(key).first()
    if (setting && setting.id) {
      await db.settings.delete(setting.id)
    }
  }
  
  // ============ Documents (RAG) ============
  
  static async addDocument(doc: Omit<Document, 'id'>): Promise<string> {
    const id = await db.documents.add(doc as Document)
    return String(id)
  }
  
  static async getDocuments(): Promise<Document[]> {
    return await db.documents.orderBy('uploadedAt').reverse().toArray()
  }
  
  static async getDocument(id: string): Promise<Document | undefined> {
    return await db.documents.get(id)
  }
  
  static async deleteDocument(id: string): Promise<void> {
    await db.documents.delete(id)
    // Also delete associated chunks
    await db.documentChunks.where('documentId').equals(id).delete()
  }
  
  // Document Chunks
  static async addChunks(chunks: Omit<DocumentChunk, 'id'>[]): Promise<void> {
    await db.documentChunks.bulkAdd(chunks as DocumentChunk[])
  }
  
  static async getChunksByDocument(documentId: string): Promise<DocumentChunk[]> {
    return await db.documentChunks
      .where('documentId')
      .equals(documentId)
      .toArray()
  }
  
  static async getAllChunks(): Promise<DocumentChunk[]> {
    return await db.documentChunks.toArray()
  }

  // ============ Import/Export ============

  static async exportData(): Promise<string> {
    const conversations = await db.conversations.toArray()
    const messages = await db.messages.toArray()
    const memories = await db.memories.toArray()
    const settings = await db.settings.toArray()

    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      conversations,
      messages,
      memories,
      settings,
    }

    return JSON.stringify(data, null, 2)
  }

  static async importData(jsonData: string): Promise<{ success: boolean; error?: string }> {
    try {
      const data = JSON.parse(jsonData)

      // Validate data structure
      if (!data.conversations || !data.messages || !data.memories) {
        return { success: false, error: 'Invalid data format' }
      }

      // Clear existing data (optional, can be made configurable)
      await db.conversations.clear()
      await db.messages.clear()
      await db.memories.clear()

      // Import data
      await db.conversations.bulkAdd(data.conversations)
      await db.messages.bulkAdd(data.messages)
      await db.memories.bulkAdd(data.memories)
      if (data.settings) {
        await db.settings.bulkAdd(data.settings)
      }

      return { success: true }
    } catch (error) {
      console.error('Import error:', error)
      return { success: false, error: String(error) }
    }
  }

  // ============ Maintenance ============

  static async clearAllData(): Promise<void> {
    await db.conversations.clear()
    await db.messages.clear()
    await db.memories.clear()
    await db.settings.clear()
  }

  static async getDatabaseStats() {
    const conversationCount = await db.conversations.count()
    const messageCount = await db.messages.count()
    const memoryCount = await db.memories.count()
    
    return {
      conversations: conversationCount,
      messages: messageCount,
      memories: memoryCount,
    }
  }

  // Storage Usage
  static async getStorageUsage(): Promise<{
    conversations: number
    messages: number
    memories: number
    documents: number
    total: number
    formatted: string
  }> {
    try {
      // Calculate approximate size by serializing data
      const conversations = await db.conversations.toArray()
      const messages = await db.messages.toArray()
      const memories = await db.memories.toArray()
      const documents = await db.documents.toArray()

      const conversationsSize = new Blob([JSON.stringify(conversations)]).size
      const messagesSize = new Blob([JSON.stringify(messages)]).size
      const memoriesSize = new Blob([JSON.stringify(memories)]).size
      const documentsSize = new Blob([JSON.stringify(documents)]).size

      const totalSize = conversationsSize + messagesSize + memoriesSize + documentsSize

      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
      }

      return {
        conversations: conversationsSize,
        messages: messagesSize,
        memories: memoriesSize,
        documents: documentsSize,
        total: totalSize,
        formatted: formatBytes(totalSize),
      }
    } catch (error) {
      console.error('Failed to calculate storage:', error)
      return {
        conversations: 0,
        messages: 0,
        memories: 0,
        documents: 0,
        total: 0,
        formatted: '0 B',
      }
    }
  }
}

// Helper function to migrate from localStorage to IndexedDB
export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    // Check if there's data in IndexedDB already
    const existingConversations = await db.conversations.count()
    if (existingConversations > 0) {
      return false // Already migrated
    }

    // Migrate conversations
    const conversationsData = localStorage.getItem('conversations')
    if (conversationsData) {
      const conversations = JSON.parse(conversationsData)
      for (const conv of conversations) {
        const id = await db.conversations.add({
          title: conv.title,
          model: conv.model,
          created_at: conv.created_at || new Date().toISOString(),
          updated_at: conv.updated_at,
        })

        // Migrate messages for this conversation
        const messagesData = localStorage.getItem(`messages_${conv.id}`)
        if (messagesData) {
          const messages = JSON.parse(messagesData)
          for (const msg of messages) {
            await db.messages.add({
              conversation_id: String(id),
              role: msg.role,
              content: msg.content,
              created_at: msg.created_at || new Date().toISOString(),
            })
          }
        }
      }
    }

    // Migrate memories
    const memoriesData = localStorage.getItem('symchat_memories')
    if (memoriesData) {
      const { memories } = JSON.parse(memoriesData)
      for (const mem of memories) {
        await db.memories.add({
          content: mem.content,
          category: mem.category,
          importance: mem.importance,
          created_at: mem.created_at,
          updated_at: mem.updated_at,
        })
      }
    }

    // Migrate dark mode setting
    const darkMode = localStorage.getItem('darkMode')
    if (darkMode !== null) {
      await db.settings.add({ key: 'darkMode', value: darkMode })
    }

    return true
  } catch (error) {
    console.error('Migration error:', error)
    return false
  }
}

