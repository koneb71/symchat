import { Button } from "./ui/button";
import { Edit2, RotateCw, Copy, Trash2, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface MessageActionsProps {
  role: "user" | "assistant" | "system";
  content: string;
  messageIndex: number;
  onEdit?: (index: number, newContent: string) => void;
  onRegenerate?: (fromIndex: number) => void;
  onDelete?: (index: number) => void;
  onCopy?: (content: string) => void;
}

export function MessageActions({
  role,
  content,
  messageIndex,
  onEdit,
  onRegenerate,
  onDelete,
  onCopy,
}: MessageActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    if (onCopy) {
      onCopy(content);
    }
    toast({
      title: "Copied to clipboard",
      description: "Message content copied successfully",
    });
  };

  const handleEdit = () => {
    if (role === "user" && onEdit) {
      setIsEditing(true);
      setEditedContent(content);
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(messageIndex, editedContent);
      setIsEditing(false);
      toast({
        title: "Message edited",
        description: "Conversation will continue from this point",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(content);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(messageIndex);
      toast({
        title: "Regenerating response",
        description: "Creating a new response...",
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(messageIndex);
      toast({
        title: "Message deleted",
        description: "Message removed from conversation",
      });
    }
  };

  if (isEditing) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSaveEdit}
            size="sm"
            variant="default"
            className="gap-1"
          >
            <Check className="h-4 w-4" />
            Save & Regenerate
          </Button>
          <Button
            onClick={handleCancelEdit}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        onClick={handleCopy}
        size="sm"
        variant="ghost"
        className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
        title="Copy message"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>

      {role === "user" && onEdit && (
        <Button
          onClick={handleEdit}
          size="sm"
          variant="ghost"
          className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
          title="Edit message"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      )}

      {role === "assistant" && onRegenerate && (
        <Button
          onClick={handleRegenerate}
          size="sm"
          variant="ghost"
          className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
          title="Regenerate response"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
      )}

      {onDelete && (
        <Button
          onClick={handleDelete}
          size="sm"
          variant="ghost"
          className="h-8 px-2 gap-1 text-muted-foreground hover:text-destructive"
          title="Delete message"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
