import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Server, RefreshCw, CheckCircle2, XCircle, Cpu } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  getLLMConfig,
  saveLLMConfig,
  listLLMModels,
  type LLMProvider,
} from "@/lib/llm-provider";

interface LLMProviderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderChange?: () => void;
}

export function LLMProviderSettings({
  isOpen,
  onClose,
  onProviderChange,
}: LLMProviderSettingsProps) {
  const [provider, setProvider] = useState<LLMProvider>("ollama");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [llamacppUrl, setLlamacppUrl] = useState("http://localhost:8080");
  const [llamacppEnabled, setLlamacppEnabled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getLLMConfig();
      setProvider(config.provider);
      setOllamaUrl(config.ollamaUrl);
      setLlamacppUrl(config.llamacppUrl);
      setLlamacppEnabled(localStorage.getItem("llamacpp_enabled") === "true");
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Temporarily save to test
    const originalConfig = getLLMConfig();
    saveLLMConfig({ provider, ollamaUrl, llamacppUrl });

    try {
      const models = await listLLMModels();

      if (models.length > 0) {
        setTestResult({
          success: true,
          message: `✓ Connected successfully! Found ${models.length} model(s).`,
        });
      } else {
        setTestResult({
          success: false,
          message: "⚠ Connected but no models found. Make sure models are loaded.",
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `✗ Connection failed: ${error.message}`,
      });
      // Restore original config on failure
      saveLLMConfig(originalConfig);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveLLMConfig({ provider, ollamaUrl, llamacppUrl });
    localStorage.setItem("llamacpp_enabled", String(llamacppEnabled));

    const backends = [];
    backends.push("Ollama");
    if (llamacppEnabled) backends.push("llama.cpp");

    toast({
      title: "Settings Saved",
      description: `Configured backends: ${backends.join(" + ")}`,
    });

    if (onProviderChange) {
      onProviderChange();
    }

    onClose();
  };

  const handleReset = () => {
    setProvider("ollama");
    setOllamaUrl("http://localhost:11434");
    setLlamacppUrl("http://localhost:8080");
    setLlamacppEnabled(false);
    setTestResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            LLM Backend Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-sm text-muted-foreground">
            Configure your LLM backends. Models from all enabled backends will appear in the selector!
          </p>

          {/* Ollama Configuration */}
          <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label htmlFor="ollama_url" className="font-semibold">
                Ollama (Always Enabled)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Native Ollama API with model management
            </p>
            <Input
              id="ollama_url"
              type="url"
              value={ollamaUrl}
              onChange={(e) => {
                setOllamaUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="http://localhost:11434"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Default: <code className="px-1 py-0.5 bg-muted rounded">http://localhost:11434</code>
            </p>
          </div>

          {/* llama.cpp Configuration */}
          <div className="space-y-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <Label htmlFor="llamacpp_enabled" className="font-semibold">
                  llama.cpp
                </Label>
              </div>
              <Switch
                id="llamacpp_enabled"
                checked={llamacppEnabled}
                onCheckedChange={setLlamacppEnabled}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              OpenAI-compatible API (llama-server)
            </p>
            <Input
              id="llamacpp_url"
              type="url"
              value={llamacppUrl}
              onChange={(e) => {
                setLlamacppUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="http://localhost:8080"
              className="font-mono text-sm"
              disabled={!llamacppEnabled}
            />
            <p className="text-xs text-muted-foreground">
              Default: <code className="px-1 py-0.5 bg-muted rounded">http://localhost:8080</code>
              <br />
              Start with: <code className="px-1 py-0.5 bg-muted rounded">docker-compose --profile llamacpp up -d</code>
            </p>
          </div>

          {/* Test Connection */}
          <div className="space-y-3">
            <Button
              onClick={handleTest}
              disabled={isTesting}
              variant="outline"
              className="w-full gap-2"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Server className="h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>

            {testResult && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  testResult.success
                    ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    testResult.success
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {testResult.message}
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Each model shows an icon: <Cpu className="inline h-3 w-3" /> (Ollama) or <Server className="inline h-3 w-3" /> (llama.cpp)</li>
              <li>The app automatically routes requests to the correct backend</li>
              <li>Enable llama.cpp to see models from both providers</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isTesting}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

