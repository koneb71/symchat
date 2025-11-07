import { useState, KeyboardEvent, useRef, forwardRef } from "react";
import { Button } from "./ui/button";
import {
  Send,
  Square,
  Globe,
  Upload,
  Loader2,
  Paperclip,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  autoSearchEnabled?: boolean;
  onToggleAutoSearch?: () => void;
  isAutoSearching?: boolean;
  onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isVisionModel?: boolean;
  deepResearchEnabled?: boolean;
  onToggleDeepResearch?: () => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput(
    {
      onSend,
      onStop,
      disabled,
      isGenerating,
      autoSearchEnabled,
      onToggleAutoSearch,
      isAutoSearching,
      onImageUpload,
      onFileUpload,
      isVisionModel,
      deepResearchEnabled,
      onToggleDeepResearch,
    },
    ref
  ) {
    const [input, setInput] = useState("");
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
      if (input.trim() && !disabled) {
        onSend(input.trim());
        setInput("");
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleImageClick = () => {
      imageInputRef.current?.click();
    };

    const handleFileClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={ref}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={disabled}
            className={cn(
              "w-full min-h-[60px] max-h-[200px] pl-4 pr-24 py-3 rounded-lg border bg-background resize-none",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            rows={1}
          />
          {/* Inline buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* Deep Research Toggle */}
            {onToggleDeepResearch && (
              <Button
                variant={deepResearchEnabled ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-8 w-8",
                  deepResearchEnabled && "bg-purple-500 hover:bg-purple-600"
                )}
                onClick={onToggleDeepResearch}
                disabled={isGenerating}
                title={
                  deepResearchEnabled
                    ? "Deep Research: ON - Will perform multi-step research"
                    : "Deep Research: OFF - Click to enable"
                }
              >
                <Brain className="h-4 w-4" />
              </Button>
            )}

            {/* Auto Search Toggle */}
            {onToggleAutoSearch && (
              <Button
                variant={autoSearchEnabled ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-8 w-8",
                  autoSearchEnabled && "bg-blue-500 hover:bg-blue-600"
                )}
                onClick={onToggleAutoSearch}
                disabled={isGenerating}
                title={
                  autoSearchEnabled ? "Auto Search: ON" : "Auto Search: OFF"
                }
              >
                {isAutoSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Image Upload */}
            {isVisionModel && onImageUpload && (
              <>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={onImageUpload}
                  className="hidden"
                  accept="image/*"
                  multiple
                  disabled={disabled}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleImageClick}
                  disabled={disabled}
                  title="Upload Image"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* File Upload */}
            {onFileUpload && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.csv,.json,.txt,.md,.html,.xml"
                  multiple
                  disabled={disabled}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleFileClick}
                  disabled={disabled}
                  title="Attach Files"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {isGenerating ? (
          <Button
            onClick={onStop}
            variant="destructive"
            size="icon"
            className="h-[60px] w-[60px] animate-pulse"
            title="Stop generation"
          >
            <Square className="h-5 w-5 fill-current" />
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>
    );
  }
);
