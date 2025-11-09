import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { RotateCcw, Info, FileCode } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export interface GenerationOptions {
  temperature: number;
  max_tokens: number;
  top_p: number;
  top_k: number;
  repeat_penalty: number;
  system_prompt: string;
  use_custom_system_prompt: boolean;
}

interface GenerationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  options: GenerationOptions;
  onOptionsChange: (options: GenerationOptions) => void;
  onOpenPromptLibrary?: () => void;
}

const DEFAULT_OPTIONS: GenerationOptions = {
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.9,
  top_k: 40,
  repeat_penalty: 1.1,
  system_prompt: "",
  use_custom_system_prompt: false,
};

export function GenerationSettings({
  isOpen,
  onClose,
  options,
  onOptionsChange,
  onOpenPromptLibrary,
}: GenerationSettingsProps) {
  const [localOptions, setLocalOptions] = useState<GenerationOptions>(options);

  // Sync local state when props change or dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalOptions(options);
    }
  }, [isOpen, options]);

  const handleSave = () => {
    onOptionsChange(localOptions);
    onClose();
  };

  const handleReset = () => {
    setLocalOptions(DEFAULT_OPTIONS);
  };

  const updateOption = <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => {
    setLocalOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Generation Settings</DialogTitle>
          <DialogDescription>
            Fine-tune the AI's behavior and output parameters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature" className="font-semibold">
                Temperature: {localOptions.temperature.toFixed(2)}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Controls randomness. Lower = more focused, higher = more
                      creative
                    </p>
                    <p className="text-xs mt-1">
                      Range: 0.0 (deterministic) to 2.0 (very random)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[localOptions.temperature]}
              onValueChange={(value) => updateOption("temperature", value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise (0.0)</span>
              <span>Balanced (0.7)</span>
              <span>Creative (2.0)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max_tokens" className="font-semibold">
                Max Tokens: {localOptions.max_tokens}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Maximum length of the response</p>
                    <p className="text-xs mt-1">
                      Higher values allow longer responses but take more time
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Slider
              id="max_tokens"
              min={128}
              max={8192}
              step={128}
              value={[localOptions.max_tokens]}
              onValueChange={(value) => updateOption("max_tokens", value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short (128)</span>
              <span>Medium (2048)</span>
              <span>Long (8192)</span>
            </div>
          </div>

          {/* Top P */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="top_p" className="font-semibold">
                Top P (Nucleus Sampling): {localOptions.top_p.toFixed(2)}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Considers only tokens with cumulative probability above
                      this threshold
                    </p>
                    <p className="text-xs mt-1">
                      Lower = more focused, higher = more diverse
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Slider
              id="top_p"
              min={0}
              max={1}
              step={0.05}
              value={[localOptions.top_p]}
              onValueChange={(value) => updateOption("top_p", value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Focused (0.0)</span>
              <span>Balanced (0.9)</span>
              <span>Diverse (1.0)</span>
            </div>
          </div>

          {/* Top K */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="top_k" className="font-semibold">
                Top K: {localOptions.top_k}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Limits sampling to the K most likely next tokens</p>
                    <p className="text-xs mt-1">
                      Lower = more focused, higher = more varied
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Slider
              id="top_k"
              min={1}
              max={100}
              step={1}
              value={[localOptions.top_k]}
              onValueChange={(value) => updateOption("top_k", value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Focused (1)</span>
              <span>Default (40)</span>
              <span>Very Diverse (100)</span>
            </div>
          </div>

          {/* Repeat Penalty */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="repeat_penalty" className="font-semibold">
                Repeat Penalty: {localOptions.repeat_penalty.toFixed(2)}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Penalizes repetition in the output</p>
                    <p className="text-xs mt-1">
                      1.0 = no penalty, higher = less repetition
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Slider
              id="repeat_penalty"
              min={1}
              max={2}
              step={0.05}
              value={[localOptions.repeat_penalty]}
              onValueChange={(value) =>
                updateOption("repeat_penalty", value[0])
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>No Penalty (1.0)</span>
              <span>Default (1.1)</span>
              <span>Strong (2.0)</span>
            </div>
          </div>

          {/* Custom System Prompt */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="use_custom_system" className="font-semibold">
                  Custom System Prompt
                </Label>
                <p className="text-xs text-muted-foreground">
                  Override the default system behavior
                </p>
              </div>
              <Switch
                id="use_custom_system"
                checked={localOptions.use_custom_system_prompt}
                onCheckedChange={(checked) =>
                  updateOption("use_custom_system_prompt", checked)
                }
              />
            </div>
            {localOptions.use_custom_system_prompt && (
              <>
                {onOpenPromptLibrary && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenPromptLibrary();
                      onClose();
                    }}
                    className="w-full gap-2"
                  >
                    <FileCode className="h-4 w-4" />
                    Browse Prompt Templates
                  </Button>
                )}
                <Textarea
                  placeholder="You are a helpful assistant..."
                  value={localOptions.system_prompt}
                  onChange={(e) =>
                    updateOption("system_prompt", e.target.value)
                  }
                  rows={4}
                  className="font-mono text-sm"
                />
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { DEFAULT_OPTIONS as DEFAULT_GENERATION_OPTIONS };
