import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Logo } from "./Logo";
import { ConversationSearch, type SearchFilters } from "./ConversationSearch";
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
} from "./ui/alert-dialog";
import {
  MessageSquarePlus,
  Trash2,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  Brain,
  Database,
  Globe,
  Package,
  Sliders,
  FileText,
  Search,
  HardDrive,
  Download,
  FileJson,
  FileCode,
  FileType,
  Keyboard,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { DatabaseService } from "@/lib/database";
import { downloadConversation } from "@/lib/export-conversation";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMemories: () => void;
  onOpenDataExport: () => void;
  onOpenSearchSettings: () => void;
  onOpenModelManager: () => void;
  onOpenGenerationSettings: () => void;
  onOpenDocuments: () => void;
  onOpenDeepResearch: () => void;
  onOpenKeyboardShortcuts: () => void;
  onOpenPromptLibrary: () => void;
  onOpenLLMProviderSettings: () => void;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  darkMode,
  onToggleDarkMode,
  onOpenMemories,
  onOpenDataExport,
  onOpenSearchSettings,
  onOpenModelManager,
  onOpenGenerationSettings,
  onOpenDocuments,
  onOpenDeepResearch,
  onOpenKeyboardShortcuts,
  onOpenPromptLibrary,
  onOpenLLMProviderSettings,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [storageUsage, setStorageUsage] = useState<string>("0 B");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    models: [],
    dateRange: "all",
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load storage usage initially and when conversations change
    const loadStorageUsage = async () => {
      const usage = await DatabaseService.getStorageUsage();
      setStorageUsage(usage.formatted);
    };

    loadStorageUsage();
  }, [conversations.length]);

  // Get unique models from conversations
  const availableModels = useMemo(() => {
    const models = new Set<string>();
    conversations.forEach((conv: any) => {
      if (conv.model) models.add(conv.model);
    });
    return Array.from(models);
  }, [conversations]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv: any) => {
      // Text search
      if (searchFilters.query) {
        const query = searchFilters.query.toLowerCase();
        if (!conv.title.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Model filter
      if (searchFilters.models.length > 0) {
        if (!searchFilters.models.includes(conv.model)) {
          return false;
        }
      }

      // Date range filter
      if (searchFilters.dateRange !== "all") {
        const convDate = new Date(conv.updated_at);
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;

        switch (searchFilters.dateRange) {
          case "today":
            if (now.getTime() - convDate.getTime() > dayMs) {
              return false;
            }
            break;
          case "week":
            if (now.getTime() - convDate.getTime() > 7 * dayMs) {
              return false;
            }
            break;
          case "month":
            if (now.getTime() - convDate.getTime() > 30 * dayMs) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }, [conversations, searchFilters]);

  const handleExportConversation = async (
    conversationId: string,
    format: "json" | "markdown" | "text" | "html",
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    try {
      await downloadConversation(conversationId, format);
      toast({
        title: "Export successful",
        description: `Conversation exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to export conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-card border-r transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <Logo size={36} />
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleDarkMode}
                  title={darkMode ? "Light mode" : "Dark mode"}
                >
                  {darkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Menu"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs font-semibold">
                      Quick Access
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={onOpenPromptLibrary}>
                      <FileCode className="h-4 w-4 mr-2" />
                      Prompt Templates
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onOpenKeyboardShortcuts}>
                      <Keyboard className="h-4 w-4 mr-2" />
                      Keyboard Shortcuts
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-semibold">
                      AI Features
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={onOpenGenerationSettings}>
                      <Sliders className="h-4 w-4 mr-2" />
                      Generation Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onOpenDeepResearch}>
                      <Search className="h-4 w-4 mr-2" />
                      Deep Research
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onOpenSearchSettings}>
                      <Globe className="h-4 w-4 mr-2" />
                      Web Search Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-semibold">
                      Management
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={onOpenModelManager}>
                      <Package className="h-4 w-4 mr-2" />
                      Model Manager (Ollama)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onOpenLLMProviderSettings}>
                      <Server className="h-4 w-4 mr-2" />
                      Backend Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onOpenDocuments}>
                      <FileText className="h-4 w-4 mr-2" />
                      Documents (RAG)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onOpenMemories}>
                      <Brain className="h-4 w-4 mr-2" />
                      Memories
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-semibold">
                      Data
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={onOpenDataExport}>
                      <Database className="h-4 w-4 mr-2" />
                      Export/Import
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HardDrive className="h-4 w-4 mr-2" />
                      <div className="flex-1 flex items-center justify-between">
                        <span>Storage</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {storageUsage}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Button
              onClick={onNewChat}
              className="w-full shadow-sm hover:shadow"
              size="default"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Conversation Search */}
          <ConversationSearch
            onSearch={setSearchFilters}
            availableModels={availableModels}
          />

          {/* Conversations */}
          <div className="flex-1 overflow-hidden p-2">
            <div className="mb-2 px-2 py-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chats ({filteredConversations.length}
                {filteredConversations.length !== conversations.length
                  ? ` of ${conversations.length}`
                  : ""}
                )
              </span>
            </div>

            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-1 pr-2">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <MessageSquarePlus className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {conversations.length === 0
                        ? "No chats yet"
                        : "No matching chats"}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {conversations.length === 0
                        ? 'Click "New Chat" to start'
                        : "Try different search filters"}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-all",
                        conv.id === currentConversationId
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-accent"
                      )}
                      onClick={() => onSelectConversation(conv.id)}
                      title={conv.title}
                    >
                      <MessageSquarePlus className="h-4 w-4 flex-shrink-0 opacity-60" />
                      <span className="text-sm font-medium truncate block max-w-[140px]">
                        {conv.title}
                      </span>
                      {conv.id === currentConversationId && (
                        <div
                          className="ml-auto flex-shrink-0 flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7 hover:bg-accent transition-colors",
                                  "text-primary-foreground/70"
                                )}
                                title="Export conversation"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel className="text-xs">
                                Export as
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleExportConversation(
                                    conv.id,
                                    "markdown",
                                    e
                                  )
                                }
                              >
                                <FileText className="h-3.5 w-3.5 mr-2" />
                                Markdown
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleExportConversation(conv.id, "html", e)
                                }
                              >
                                <FileCode className="h-3.5 w-3.5 mr-2" />
                                HTML
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleExportConversation(conv.id, "text", e)
                                }
                              >
                                <FileType className="h-3.5 w-3.5 mr-2" />
                                Plain Text
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleExportConversation(conv.id, "json", e)
                                }
                              >
                                <FileJson className="h-3.5 w-3.5 mr-2" />
                                JSON
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7 hover:bg-destructive hover:text-destructive-foreground transition-colors",
                                  "text-primary-foreground/70"
                                )}
                                title="Delete conversation"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Conversation?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  <strong>{conv.title}</strong>"?
                                  <br />
                                  <br />
                                  This will permanently remove this conversation
                                  and all its messages. This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteConversation(conv.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="border-t p-3">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span>Powered by</span>
              <span className="font-semibold text-foreground">Ollama</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
