import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Download, Upload, X, Database, AlertCircle } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import { toast } from '@/hooks/use-toast'

interface DataExportProps {
  isOpen: boolean
  onClose: () => void
}

export function DataExport({ isOpen, onClose }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [stats, setStats] = useState<{
    conversations: number
    messages: number
    memories: number
  } | null>(null)

  const loadStats = async () => {
    const dbStats = await DatabaseService.getDatabaseStats()
    setStats(dbStats)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const jsonData = await DatabaseService.exportData()
      
      // Create download link
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `symchat-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: 'Your data has been exported successfully',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        setIsImporting(true)
        const text = await file.text()
        const result = await DatabaseService.importData(text)

        if (result.success) {
          await loadStats()
          toast({
            title: 'Import Successful',
            description: 'Your data has been imported. Please refresh the page.',
          })
          // Reload page after a short delay
          setTimeout(() => window.location.reload(), 2000)
        } else {
          throw new Error(result.error || 'Import failed')
        }
      } catch (error) {
        console.error('Import error:', error)
        toast({
          title: 'Import Failed',
          description: 'Failed to import data. Make sure the file is valid.',
          variant: 'destructive',
        })
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      return
    }

    if (!confirm('This will delete all conversations, messages, and memories. Are you absolutely sure?')) {
      return
    }

    try {
      await DatabaseService.clearAllData()
      await loadStats()
      toast({
        title: 'Data Cleared',
        description: 'All data has been deleted. The page will reload.',
      })
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      console.error('Clear error:', error)
      toast({
        title: 'Error',
        description: 'Failed to clear data',
        variant: 'destructive',
      })
    }
  }

  // Load stats when opening
  if (isOpen && !stats) {
    loadStats()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Export, import, or manage your local database
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Database Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.conversations}</div>
                <div className="text-xs text-muted-foreground">Conversations</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.messages}</div>
                <div className="text-xs text-muted-foreground">Messages</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.memories}</div>
                <div className="text-xs text-muted-foreground">Memories</div>
              </div>
            </div>
          )}

          {/* Export Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Export Data</h3>
            <p className="text-sm text-muted-foreground">
              Download all your data as a JSON file for backup
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </Button>
          </div>

          {/* Import Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Import Data</h3>
            <p className="text-sm text-muted-foreground">
              Restore data from a previously exported JSON file
            </p>
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Warning: Importing will replace all existing data
              </p>
            </div>
            <Button
              onClick={handleImport}
              disabled={isImporting}
              variant="outline"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import Data'}
            </Button>
          </div>

          {/* Clear All Section */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold text-sm text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete all data from the local database
            </p>
            <Button
              onClick={handleClearAll}
              variant="destructive"
              className="w-full"
            >
              Clear All Data
            </Button>
          </div>
        </CardContent>

        <div className="border-t p-4 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            💾 Your data is stored locally in IndexedDB, a built-in browser database.
            It persists across sessions and uses no server storage.
          </p>
        </div>
      </Card>
    </div>
  )
}

