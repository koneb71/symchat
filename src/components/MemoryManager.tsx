import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import {
  Brain,
  Plus,
  Trash2,
  User,
  Settings,
  Lightbulb,
  FileText,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getMemories,
  addMemory,
  deleteMemory,
  clearAllMemories,
  type Memory,
} from '@/lib/memory-db'
import { toast } from '@/hooks/use-toast'

interface MemoryManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function MemoryManager({ isOpen, onClose }: MemoryManagerProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [newMemory, setNewMemory] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Memory['category']>('fact')
  const [selectedImportance, setSelectedImportance] = useState<Memory['importance']>('medium')
  const [filterCategory, setFilterCategory] = useState<Memory['category'] | 'all'>('all')

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async () => {
    const loadedMemories = await getMemories()
    setMemories(loadedMemories)
  }

  const handleAddMemory = async () => {
    if (!newMemory.trim()) {
      toast({
        title: 'Error',
        description: 'Memory content cannot be empty',
        variant: 'destructive',
      })
      return
    }

    await addMemory(newMemory.trim(), selectedCategory, selectedImportance)
    setNewMemory('')
    await loadMemories()
    toast({
      title: 'Memory Added',
      description: 'The memory has been saved successfully',
    })
  }

  const handleDeleteMemory = async (id: string) => {
    const success = await deleteMemory(id)
    if (success) {
      await loadMemories()
      toast({
        title: 'Memory Deleted',
        description: 'The memory has been removed',
      })
    }
  }

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all memories? This cannot be undone.')) {
      await clearAllMemories()
      await loadMemories()
      toast({
        title: 'All Memories Cleared',
        description: 'All memories have been deleted',
      })
    }
  }

  const filteredMemories =
    filterCategory === 'all'
      ? memories
      : memories.filter((m) => m.category === filterCategory)

  const getCategoryIcon = (category: Memory['category']) => {
    switch (category) {
      case 'user_info':
        return <User className="h-4 w-4" />
      case 'preference':
        return <Settings className="h-4 w-4" />
      case 'fact':
        return <Lightbulb className="h-4 w-4" />
      case 'context':
        return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: Memory['category']) => {
    switch (category) {
      case 'user_info':
        return 'User Info'
      case 'preference':
        return 'Preference'
      case 'fact':
        return 'Fact'
      case 'context':
        return 'Context'
    }
  }

  const getImportanceColor = (importance: Memory['importance']) => {
    switch (importance) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-gray-500'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Memory Manager</CardTitle>
                <CardDescription>
                  Manage AI memories to provide better context across conversations
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-6 space-y-4">
          {/* Add Memory Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Add New Memory</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter a memory (e.g., User prefers detailed explanations)"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={(value: string) => setSelectedCategory(value as Memory['category'])}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_info">User Info</SelectItem>
                  <SelectItem value="preference">Preference</SelectItem>
                  <SelectItem value="fact">Fact</SelectItem>
                  <SelectItem value="context">Context</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedImportance}
                onValueChange={(value: string) => setSelectedImportance(value as Memory['importance'])}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleAddMemory}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter:</span>
              <Select
                value={filterCategory}
                onValueChange={(value: string) => setFilterCategory(value as Memory['category'] | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="user_info">User Info</SelectItem>
                  <SelectItem value="preference">Preference</SelectItem>
                  <SelectItem value="fact">Fact</SelectItem>
                  <SelectItem value="context">Context</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'}
              </span>
              {memories.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Memories List */}
          <ScrollArea className="flex-1 h-[400px]">
            {filteredMemories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                <Brain className="h-12 w-12 mb-3 opacity-20" />
                <p>No memories yet</p>
                <p className="text-sm">Add memories to help the AI remember important context</p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredMemories.map((memory) => (
                  <Card key={memory.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getCategoryIcon(memory.category)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words">{memory.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {getCategoryLabel(memory.category)}
                          </span>
                          <span className={cn('font-medium', getImportanceColor(memory.importance))}>
                            {memory.importance}
                          </span>
                          <span>
                            {new Date(memory.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => memory.id && handleDeleteMemory(memory.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Memories are included in conversations to provide context. High importance
            memories are prioritized.
          </p>
        </div>
      </Card>
    </div>
  )
}

