import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { preloadModel } from "@/lib/ollama";
import { listLLMModels, type LLMModel, type LLMProvider } from "@/lib/llm-provider";
import { toast } from "@/hooks/use-toast";
import { Loader2, Cpu, Server } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string, provider: LLMProvider) => void;
  onModelsLoaded?: () => void;
  onNoModels?: () => void;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  onModelsLoaded,
  onNoModels,
}: ModelSelectorProps) {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    loadModels(true); // Initial load
    // Set up interval to refresh models every 10 seconds
    const interval = setInterval(() => loadModels(false), 10000);
    return () => clearInterval(interval);
  }, []);

  // Preload model when it changes (Ollama only)
  useEffect(() => {
    if (selectedModel && !loading) {
      const model = models.find(m => m.name === selectedModel);
      if (model?.provider === 'ollama') {
        handlePreloadModel(selectedModel);
      }
    }
  }, [selectedModel, loading, models]);

  const handlePreloadModel = async (modelName: string) => {
    setIsPreloading(true);
    try {
      const success = await preloadModel(modelName);
      if (success) {
        console.log(`Model ${modelName} preloaded successfully`);
      }
    } catch (error) {
      console.error("Failed to preload model:", error);
    } finally {
      setIsPreloading(false);
    }
  };

  const loadModels = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const modelList = await listLLMModels();
      setModels(modelList);

      // Auto-select first model ONLY on initial load when no model is selected
      // OR if the currently selected model no longer exists
      if (modelList.length > 0) {
        const modelExists = modelList.find((m) => m.name === selectedModel);

        if (isInitialLoad && !selectedModel) {
          // First time loading and no model selected - auto-select first
          onModelChange(modelList[0].name, modelList[0].provider || 'ollama');
        } else if (selectedModel && !modelExists) {
          // Selected model was deleted - switch to first available
          onModelChange(modelList[0].name, modelList[0].provider || 'ollama');
        }
      } else {
        toast({
          title: "No models found",
          description: "Make sure Ollama or llama.cpp is running...",
        });
        // Trigger callback to open Model Manager
        onNoModels?.();
      }

      if (isInitialLoad) {
        onModelsLoaded?.();
      }
    } catch (error) {
      console.error("Failed to load models:", error);
      toast({
        title: "Failed to load models",
        description: "Make sure Ollama or llama.cpp is running",
        variant: "destructive",
      });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading models...
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <button
        onClick={() => onNoModels?.()}
        className="text-sm text-destructive hover:text-destructive/80 underline cursor-pointer"
      >
        No models available - Click to download
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedModel} 
        onValueChange={(value) => {
          const model = models.find(m => m.name === value);
          onModelChange(value, model?.provider || 'ollama');
        }}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={`${model.provider}-${model.name}`} value={model.name}>
              <div className="flex items-center gap-2">
                {model.provider === 'ollama' ? (
                  <Cpu className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <Server className="h-3.5 w-3.5 text-purple-500" />
                )}
                <span>{model.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPreloading && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
}
