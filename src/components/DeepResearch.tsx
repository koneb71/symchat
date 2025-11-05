import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Progress } from './ui/progress'
import { 
  Search, 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Brain,
  Globe,
  FileText,
} from 'lucide-react'
import { performDeepResearch, type ResearchProgress } from '@/lib/deep-research'
import { toast } from '@/hooks/use-toast'

interface DeepResearchProps {
  isOpen: boolean
  onClose: () => void
  onUseResearch: (report: string) => void
}

export function DeepResearch({ isOpen, onClose, onUseResearch }: DeepResearchProps) {
  const [query, setQuery] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [progress, setProgress] = useState<ResearchProgress | null>(null)

  const handleStartResearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Query Required',
        description: 'Please enter a research topic',
        variant: 'destructive',
      })
      return
    }

    setIsResearching(true)
    setProgress(null)

    try {
      await performDeepResearch(query, (newProgress) => {
        setProgress(newProgress)
      })
      
      toast({
        title: 'Research Complete',
        description: 'Deep research has been completed successfully',
      })
    } catch (error: any) {
      console.error('Deep research failed:', error)
      toast({
        title: 'Research Failed',
        description: error.message || 'Failed to complete research',
        variant: 'destructive',
      })
    } finally {
      setIsResearching(false)
    }
  }

  const handleUseResearch = () => {
    if (progress?.finalReport) {
      onUseResearch(progress.finalReport)
      onClose()
      setQuery('')
      setProgress(null)
    }
  }

  const handleReset = () => {
    setQuery('')
    setProgress(null)
    setIsResearching(false)
  }

  if (!isOpen) return null

  const progressPercent = progress 
    ? Math.round((progress.currentStep / progress.totalSteps) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Deep Research</CardTitle>
                <CardDescription>
                  Multi-step web research with comprehensive analysis
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-6 space-y-6">
          {/* Research Query Input */}
          {!progress && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Research Topic</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Latest developments in quantum computing"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isResearching) {
                        handleStartResearch()
                      }
                    }}
                    disabled={isResearching}
                    className="text-lg h-12"
                  />
                  <Button
                    onClick={handleStartResearch}
                    disabled={isResearching || !query.trim()}
                    size="lg"
                    className="px-8"
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Start Research
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Info Card */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  How Deep Research Works
                </h4>
                <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                  <p>• Breaks down your query into multiple research angles</p>
                  <p>• Performs web searches for each angle</p>
                  <p>• Gathers information from multiple sources</p>
                  <p>• Synthesizes findings into a comprehensive report</p>
                  <p>• You can use the report as context for AI analysis</p>
                </div>
              </div>
            </div>
          )}

          {/* Research Progress */}
          {progress && (
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {progress.status === 'planning' && '📋 Planning research...'}
                    {progress.status === 'researching' && `🔍 Researching... (${progress.currentStep}/${progress.totalSteps})`}
                    {progress.status === 'synthesizing' && '🧠 Synthesizing results...'}
                    {progress.status === 'completed' && '✅ Research Complete'}
                    {progress.status === 'failed' && '❌ Research Failed'}
                  </span>
                  <span className="text-muted-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Research Steps */}
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-3">
                  {progress.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {step.status === 'pending' && (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        {step.status === 'searching' && (
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        )}
                        {step.status === 'completed' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {step.status === 'failed' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">Step {index + 1}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{step.query}</p>
                        
                        {step.results && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            ✓ Found {step.results.results.length} sources
                          </p>
                        )}
                        {step.error && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            ✗ {step.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              {progress.status === 'completed' && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleUseResearch}
                    className="flex-1"
                    size="lg"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Use Research as Context
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                  >
                    New Research
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

