import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import {
  listModels,
  pullModel,
  deleteModel,
  type OllamaModel,
} from '@/lib/ollama'
import { Download, Trash2, Package, Loader2, Search, Eye, HardDrive, Calendar, X } from 'lucide-react'
import { Progress } from './ui/progress'

interface ModelManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function ModelManager({ isOpen, onClose }: ModelManagerProps) {
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([])
  const [modelName, setModelName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{
    status: string
    percent: number
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadModels()
    }
  }, [isOpen])

  const loadModels = async () => {
    try {
      const models = await listModels()
      setInstalledModels(models)
    } catch (error) {
      console.error('Failed to load models:', error)
      toast({
        title: 'Error',
        description: 'Failed to load installed models',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async () => {
    if (!modelName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a model name',
        variant: 'destructive',
      })
      return
    }

    const model = modelName.trim()
    
    try {
      setDownloadingModel(model)
      setDownloadProgress({ status: 'Starting download...', percent: 0 })

      await pullModel(model, (progress) => {
        const percent = progress.total
          ? Math.round((progress.completed || 0) / progress.total * 100)
          : 0
        setDownloadProgress({
          status: progress.status,
          percent,
        })
      })

      toast({
        title: 'Success',
        description: `Model "${model}" downloaded successfully!`,
      })

      await loadModels()
      setDownloadingModel(null)
      setDownloadProgress(null)
      setModelName('')
    } catch (error) {
      console.error('Failed to pull model:', error)
      toast({
        title: 'Download Failed',
        description: `Failed to download "${model}". Make sure Ollama is running.`,
        variant: 'destructive',
      })
      setDownloadingModel(null)
      setDownloadProgress(null)
    }
  }

  const handleDelete = async (model: string) => {
    try {
      await deleteModel(model)
      toast({
        title: 'Model Deleted',
        description: `"${model}" has been removed from your system`,
      })
      await loadModels()
    } catch (error) {
      console.error('Failed to delete model:', error)
      toast({
        title: 'Error',
        description: `Failed to delete "${model}"`,
        variant: 'destructive',
      })
    }
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`
    }
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const filteredModels = installedModels.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Model Manager</CardTitle>
                <CardDescription>Download and manage Ollama models</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-6">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {/* Download Section */}
              <div className="border rounded-xl p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Download New Model</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse models at{' '}
                      <a
                        href="https://ollama.com/library"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Ollama Library →
                      </a>
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {installedModels.length} installed
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter model name (e.g., llama2, mistral, codellama:13b)"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !downloadingModel) {
                        handleDownload()
                      }
                    }}
                    disabled={!!downloadingModel}
                    className="h-11"
                  />
                  <Button
                    onClick={handleDownload}
                    disabled={!!downloadingModel || !modelName.trim()}
                    size="default"
                    className="px-6 h-11"
                  >
                    {downloadingModel ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>

                {/* Download Progress */}
                {downloadingModel && downloadProgress && (
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm font-medium">
                          Downloading: {downloadingModel}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {downloadProgress.percent}%
                      </span>
                    </div>
                    <Progress value={downloadProgress.percent} className="h-2" />
                    <p className="text-xs text-muted-foreground animate-pulse">
                      {downloadProgress.status}
                    </p>
                  </div>
                )}

                {/* Popular Models Suggestions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Popular Models</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['llama3.2', 'mistral', 'codellama', 'gemma2'].map((model) => (
                      <Button
                        key={model}
                        variant="secondary"
                        size="sm"
                        onClick={() => setModelName(model)}
                        disabled={!!downloadingModel}
                        className="justify-center font-mono"
                      >
                        {model}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Vision Models */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Vision Models (Support Images)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['llava', 'llama3.2-vision', 'bakllava', 'moondream'].map((model) => (
                      <Button
                        key={model}
                        variant="secondary"
                        size="sm"
                        onClick={() => setModelName(model)}
                        disabled={!!downloadingModel}
                        className="justify-center font-mono"
                      >
                        {model}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Installed Models Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      Installed Models
                      <Badge variant="outline">{installedModels.length}</Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your downloaded models
                    </p>
                  </div>
                  {installedModels.length > 3 && (
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  )}
                </div>

                {filteredModels.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">No models installed</h3>
                    <p className="text-sm text-muted-foreground">
                      Download a model from above to get started
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredModels.map((model) => (
                      <div
                        key={model.name}
                        className="group border rounded-xl p-4 hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-base font-mono truncate">
                                {model.name}
                              </h4>
                              {model.details?.parameter_size && (
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {model.details.parameter_size}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3.5 w-3.5" />
                                {formatSize(model.size)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(model.modified_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Model?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "<strong className="font-mono">{model.name}</strong>"?
                                  <br /><br />
                                  This will remove the model from your system ({formatSize(model.size)}). 
                                  You can re-download it later if needed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(model.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Model
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

