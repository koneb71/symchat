import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { listModels, type OllamaModel } from "@/lib/ollama"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  onModelsLoaded?: () => void
  onNoModels?: () => void
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  onModelsLoaded,
  onNoModels,
}: ModelSelectorProps) {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModels(true) // Initial load
    // Set up interval to refresh models every 10 seconds
    const interval = setInterval(() => loadModels(false), 10000)
    return () => clearInterval(interval)
  }, [])

  const loadModels = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      }
      const modelList = await listModels()
      setModels(modelList)

      // Auto-select first model ONLY on initial load when no model is selected
      // OR if the currently selected model no longer exists
      if (modelList.length > 0) {
        const modelExists = modelList.find((m) => m.name === selectedModel)

        if (isInitialLoad && !selectedModel) {
          // First time loading and no model selected - auto-select first
          onModelChange(modelList[0].name)
        } else if (selectedModel && !modelExists) {
          // Selected model was deleted - switch to first available
          onModelChange(modelList[0].name)
        }
      } else {
        toast({
          title: "No models found",
          description: "Opening Model Manager to download models...",
        })
        // Trigger callback to open Model Manager
        onNoModels?.()
      }

      if (isInitialLoad) {
        onModelsLoaded?.()
      }
    } catch (error) {
      console.error("Failed to load models:", error)
      toast({
        title: "Failed to load models",
        description: "Make sure Ollama is running on localhost:11434",
        variant: "destructive",
      })
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading models...
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <button
        onClick={() => onNoModels?.()}
        className="text-sm text-destructive hover:text-destructive/80 underline cursor-pointer"
      >
        No models available - Click to download
      </button>
    )
  }

  return (
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.name} value={model.name}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
