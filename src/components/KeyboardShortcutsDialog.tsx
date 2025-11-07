import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Keyboard } from 'lucide-react'

interface Shortcut {
  keys: string
  description: string
  category: string
}

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const shortcuts: Shortcut[] = [
    // Navigation
    { keys: 'Ctrl+K', description: 'New chat', category: 'Navigation' },
    { keys: 'Ctrl+B', description: 'Toggle sidebar', category: 'Navigation' },
    { keys: 'Ctrl+/', description: 'Search conversations', category: 'Navigation' },
    { keys: 'Ctrl+L', description: 'Focus message input', category: 'Navigation' },

    // Actions
    { keys: 'Ctrl+E', description: 'Export current conversation', category: 'Actions' },
    { keys: 'Ctrl+,', description: 'Open settings', category: 'Actions' },
    { keys: 'Ctrl+Delete', description: 'Delete current conversation', category: 'Actions' },
    { keys: 'Ctrl+Enter', description: 'Send message', category: 'Actions' },

    // General
    { keys: 'Esc', description: 'Close modal or dialog', category: 'General' },
    { keys: 'Shift+?', description: 'Show keyboard shortcuts', category: 'General' },
  ]

  // Group shortcuts by category
  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-white" />
            </div>
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.split('+').map((key, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && (
                              <span className="text-muted-foreground">+</span>
                            )}
                            <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded shadow-sm">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 rounded border border-blue-300 dark:border-blue-700">Shift+?</kbd> anytime to show this dialog.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
