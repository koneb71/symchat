import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Plus, Trash2, Check, Copy, FileCode } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import { toast } from '@/hooks/use-toast'

interface PromptTemplate {
  id: string
  name: string
  prompt: string
  category: string
  created_at: string
}

interface PromptLibraryProps {
  isOpen: boolean
  onClose: () => void
  onUseTemplate: (prompt: string) => void
}

const DEFAULT_TEMPLATES: Omit<PromptTemplate, 'id' | 'created_at'>[] = [
  {
    name: 'Coding Assistant',
    category: 'Development',
    prompt: 'You are an expert software engineer. Provide clear, well-documented code with explanations. Follow best practices and consider edge cases.',
  },
  {
    name: 'Code Reviewer',
    category: 'Development',
    prompt: 'Review the following code for bugs, performance issues, and best practices. Provide specific suggestions for improvement.',
  },
  {
    name: 'Technical Writer',
    category: 'Writing',
    prompt: 'You are a technical documentation expert. Write clear, concise documentation that is easy to understand for developers.',
  },
  {
    name: 'Creative Writer',
    category: 'Writing',
    prompt: 'You are a creative writing assistant. Help with storytelling, character development, and engaging narratives.',
  },
  {
    name: 'Data Analyst',
    category: 'Analysis',
    prompt: 'You are a data analysis expert. Analyze data, identify patterns, and provide actionable insights with visualizations when possible.',
  },
]

export function PromptLibrary({ isOpen, onClose, onUseTemplate }: PromptLibraryProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrompt, setNewPrompt] = useState('')
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      const stored = await DatabaseService.getSetting('promptTemplates')
      if (stored) {
        setTemplates(JSON.parse(stored))
      } else {
        // Initialize with defaults
        const defaultsWithIds = DEFAULT_TEMPLATES.map((t, i) => ({
          ...t,
          id: `default-${i}`,
          created_at: new Date().toISOString(),
        }))
        setTemplates(defaultsWithIds)
        await DatabaseService.setSetting('promptTemplates', JSON.stringify(defaultsWithIds))
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const saveTemplates = async (newTemplates: PromptTemplate[]) => {
    try {
      await DatabaseService.setSetting('promptTemplates', JSON.stringify(newTemplates))
      setTemplates(newTemplates)
    } catch (error) {
      console.error('Failed to save templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      })
    }
  }

  const handleAdd = () => {
    if (!newName || !newPrompt) return

    const newTemplate: PromptTemplate = {
      id: `custom-${Date.now()}`,
      name: newName,
      prompt: newPrompt,
      category: newCategory || 'Custom',
      created_at: new Date().toISOString(),
    }

    const updated = [...templates, newTemplate]
    saveTemplates(updated)
    setIsAdding(false)
    setNewName('')
    setNewPrompt('')
    setNewCategory('')

    toast({
      title: 'Template Added',
      description: `"${newName}" saved to library`,
    })
  }

  const handleDelete = async (id: string) => {
    const updated = templates.filter(t => t.id !== id)
    await saveTemplates(updated)
    toast({
      title: 'Template Deleted',
      description: 'Template removed from library',
    })
  }

  const handleUse = (prompt: string) => {
    onUseTemplate(prompt)
    onClose()
    toast({
      title: 'Template Applied',
      description: 'Prompt template set as system prompt',
    })
  }

  const handleCopy = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    toast({
      title: 'Copied',
      description: 'Prompt copied to clipboard',
    })
  }

  const categories = Array.from(new Set(templates.map(t => t.category)))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Prompt Template Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Template
          </Button>

          {isAdding && (
            <div className="border rounded-lg p-4 space-y-3">
              <Input
                placeholder="Template Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                placeholder="Category (optional)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <Textarea
                placeholder="System Prompt..."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm">
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button onClick={() => setIsAdding(false)} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {templates
                      .filter((t) => t.category === category)
                      .map((template) => (
                        <div
                          key={template.id}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium">{template.name}</h4>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleCopy(template.prompt)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              {!template.id.startsWith('default-') && (
                                <Button
                                  onClick={() => handleDelete(template.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {template.prompt}
                          </p>
                          <Button
                            onClick={() => handleUse(template.prompt)}
                            size="sm"
                            className="w-full"
                          >
                            Use This Template
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

