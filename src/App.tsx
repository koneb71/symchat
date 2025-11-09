import { useEffect, useState, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { ModelSelector } from "./components/ModelSelector";
import { MemoryManager } from "./components/MemoryManager";
import { ModelManager } from "./components/ModelManager";
import { DataExport } from "./components/DataExport";
import { SearchSettings } from "./components/SearchSettings";
import { ImageUpload, type UploadedImage } from "./components/ImageUpload";
import { FileUpload, type UploadedFile } from "./components/FileUpload";
import { DocumentManager } from "./components/DocumentManager";
import { DeepResearch } from "./components/DeepResearch";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { PromptLibrary } from "./components/PromptLibrary";
import { LogoIcon } from "./components/Logo";
import {
  GenerationSettings,
  type GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
} from "./components/GenerationSettings";
import { ScrollArea } from "./components/ui/scroll-area";
import { Toaster } from "./components/ui/toaster";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { chatStream, type ChatMessage as ChatMessageType } from "./lib/ollama";
import { DatabaseService, migrateFromLocalStorage } from "./lib/database";
import { getMemoryContext } from "./lib/memory-db";
import { autoSearch, formatAutoSearchContext } from "./lib/auto-search";
import { isVisionModel, imageToBase64 } from "./lib/vision";
import { downloadConversation } from "./lib/export-conversation";
import { toast } from "./hooks/use-toast";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { Globe, FileText, Brain, Info } from "lucide-react";
import type { Conversation } from "./lib/database";

// Helper type to ensure Conversation has required id
type ConversationWithId = Conversation & { id: string };

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [conversations, setConversations] = useState<ConversationWithId[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isMemoryManagerOpen, setIsMemoryManagerOpen] = useState(false);
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [isDataExportOpen, setIsDataExportOpen] = useState(false);
  const [isSearchSettingsOpen, setIsSearchSettingsOpen] = useState(false);
  const [isGenerationSettingsOpen, setIsGenerationSettingsOpen] =
    useState(false);
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const [isDeepResearchOpen, setIsDeepResearchOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [searchContext, setSearchContext] = useState<string>("");
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(false);
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>(
    DEFAULT_GENERATION_OPTIONS
  );

  // Save generation options when they change
  useEffect(() => {
    const saveOptions = async () => {
      try {
        await DatabaseService.setSetting(
          "generationOptions",
          JSON.stringify(generationOptions)
        );
      } catch (error) {
        console.error("Failed to save generation options:", error);
      }
    };
    saveOptions();
  }, [generationOptions]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize app
    initializeApp();

    // Check for documents and auto-enable RAG
    checkAndEnableRAG();
  }, []);

  useEffect(() => {
    // Add paste event listener for images
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // Create a File object with a proper name
            const namedFile = new File(
              [file],
              `pasted-image-${Date.now()}.png`,
              {
                type: file.type,
              }
            );

            // Add to uploaded images directly
            const preview = URL.createObjectURL(namedFile);
            const isVision = isVisionModel(selectedModel);
            const imageData: UploadedImage = {
              id: `${Date.now()}-pasted`,
              file: namedFile,
              preview,
              isProcessing: isVision ? false : true, // Skip processing for vision models
            };

            setUploadedImages((prev) => {
              const updated = [...prev, imageData];
              return updated;
            });

            // Process OCR only for non-vision models
            if (!isVision) {
              processImageOCR(imageData);
            }

            toast({
              title: "Image Pasted",
              description: isVision
                ? "Image ready to send"
                : "Processing OCR...",
            });
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [selectedModel]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentResponse]);

  useEffect(() => {
    // Cleanup: abort any ongoing generation when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "k",
      ctrlKey: true,
      description: "New chat",
      callback: () => {
        createNewChat();
      },
    },
    {
      key: "b",
      ctrlKey: true,
      description: "Toggle sidebar",
      callback: () => {
        setIsSidebarOpen((prev) => !prev);
      },
    },
    {
      key: "e",
      ctrlKey: true,
      description: "Export current conversation",
      callback: async () => {
        if (currentConversationId) {
          try {
            await downloadConversation(currentConversationId, "markdown");
            toast({
              title: "Exported",
              description: "Conversation exported as Markdown",
            });
          } catch (error) {
            toast({
              title: "Export failed",
              description:
                error instanceof Error ? error.message : "Failed to export",
              variant: "destructive",
            });
          }
        }
      },
    },
    {
      key: ",",
      ctrlKey: true,
      description: "Open settings",
      callback: () => {
        setIsGenerationSettingsOpen(true);
      },
    },
    {
      key: "l",
      ctrlKey: true,
      description: "Focus message input",
      callback: () => {
        chatInputRef.current?.focus();
      },
    },
    {
      key: "Delete",
      ctrlKey: true,
      description: "Delete current conversation",
      callback: () => {
        if (currentConversationId) {
          deleteConversation(currentConversationId);
        }
      },
    },
  ]);

  const initializeApp = async () => {
    try {
      // Migrate from localStorage if needed
      const migrated = await migrateFromLocalStorage();
      if (migrated) {
        toast({
          title: "Data Migrated",
          description: "Your data has been migrated to the local database",
        });
      }

      // Load theme preference
      const darkModeSetting = await DatabaseService.getSetting("darkMode");
      const isDark = darkModeSetting === "true";
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      }

      // Load generation options
      const savedOptions = await DatabaseService.getSetting(
        "generationOptions"
      );
      if (savedOptions) {
        try {
          const parsedOptions = JSON.parse(savedOptions);
          setGenerationOptions(parsedOptions);
        } catch (error) {
          console.error("Failed to parse generation options:", error);
        }
      }

      // Load conversations
      await loadConversations();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      toast({
        title: "Initialization Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const checkAndEnableRAG = async () => {
    try {
      const documents = await DatabaseService.getDocuments();
      const previousState = ragEnabled;

      if (documents.length > 0 && !ragEnabled) {
        setRagEnabled(true);
        console.log("RAG auto-enabled: Found", documents.length, "documents");

        // Show toast only if this is a change (not initial load)
        if (previousState === false) {
          toast({
            title: "RAG Auto-Enabled",
            description: `Found ${documents.length} document${
              documents.length !== 1 ? "s" : ""
            } in your library`,
          });
        }
      } else if (documents.length === 0 && ragEnabled) {
        setRagEnabled(false);
        console.log("RAG auto-disabled: No documents found");

        toast({
          title: "RAG Disabled",
          description: "No documents in library",
        });
      }
    } catch (error) {
      console.error("Failed to check documents:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await DatabaseService.getConversations();
      setConversations(
        convs.filter((c) => c.id).map((c) => ({ ...c, id: c.id! }))
      );
      if (convs.length > 0 && convs[0].id) {
        await loadConversation(convs[0].id);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const msgs = await DatabaseService.getMessages(id);
      setMessages(msgs as ChatMessageType[]);
      setCurrentConversationId(id);
    } catch (error) {
      console.error("Failed to load conversation:", error);
      setMessages([]);
      setCurrentConversationId(id);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await DatabaseService.setSetting("darkMode", String(newMode));
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const createNewChat = async () => {
    try {
      const id = await DatabaseService.createConversation({
        title: "New Chat",
        model: selectedModel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      await loadConversations();
      setCurrentConversationId(id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const conversationToDelete = conversations.find((c) => c.id === id);
      await DatabaseService.deleteConversation(id);
      const updatedConvs = conversations.filter((c) => c.id !== id);
      setConversations(updatedConvs);

      if (currentConversationId === id) {
        if (updatedConvs.length > 0 && updatedConvs[0].id) {
          await loadConversation(updatedConvs[0].id);
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }

      toast({
        title: "Chat Deleted",
        description: `"${conversationToDelete?.title}" has been removed`,
      });
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const updateConversationTitle = async (id: string, firstMessage: string) => {
    try {
      const title =
        firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
      await DatabaseService.updateConversation(id, { title });
      await loadConversations();
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  };

  const processImageOCR = async (imageData: UploadedImage) => {
    try {
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(imageData.file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const extractedText = result.data.text.trim();

      setUploadedImages((prev) => {
        return prev.map((img) =>
          img.id === imageData.id
            ? { ...img, extractedText, isProcessing: false }
            : img
        );
      });

      if (extractedText) {
        toast({
          title: "✓ OCR Complete",
          description: `Extracted ${
            extractedText.split(/\s+/).length
          } words from image`,
        });
      } else {
        toast({
          title: "No text found",
          description: "No readable text detected in the image",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      setUploadedImages((prev) => {
        return prev.map((img) =>
          img.id === imageData.id
            ? { ...img, isProcessing: false, extractedText: "[OCR failed]" }
            : img
        );
      });
      toast({
        title: "OCR Failed",
        description: "Failed to extract text from image",
        variant: "destructive",
      });
    }
  };

  const handleImageUploadInline = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const isVision = isVisionModel(selectedModel);

    for (const file of Array.from(files)) {
      // Check if it's an image
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not an image`,
          variant: "destructive",
        });
        continue;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Image "${file.name}" exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }

      const preview = URL.createObjectURL(file);
      const imageData: UploadedImage = {
        id: `${Date.now()}-${file.name}`,
        file,
        preview,
        isProcessing: isVision ? false : true,
      };

      setUploadedImages((prev) => [...prev, imageData]);

      // Process OCR for non-vision models
      if (!isVision) {
        processImageOCR(imageData);
      }
    }

    // Clear the input so the same file can be selected again
    event.target.value = "";

    toast({
      title: "Image Added",
      description: isVision
        ? `${files.length} image(s) ready to send`
        : "Processing OCR...",
    });
  };

  const handleFileUploadInline = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const { isSupportedFileType, getFileTypeName, parseDocument } =
      await import("./lib/document-parser");

    for (const file of Array.from(files)) {
      // Check if file type is supported
      if (!isSupportedFileType(file)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} format is not supported`,
          variant: "destructive",
        });
        continue;
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive",
        });
        continue;
      }

      const fileData: UploadedFile = {
        id: `${Date.now()}-${file.name}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        typeName: getFileTypeName(file),
        isProcessing: true,
      };

      setUploadedFiles((prev) => [...prev, fileData]);

      // Process file in background
      try {
        const { text } = await parseDocument(file);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, extractedText: text, isProcessing: false }
              : f
          )
        );
      } catch (error: any) {
        console.error("File processing error:", error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, isProcessing: false, error: error.message }
              : f
          )
        );
        toast({
          title: "Processing Failed",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }

    // Clear the input
    event.target.value = "";

    toast({
      title: "Files Added",
      description: `Processing ${files.length} file(s)...`,
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedModel) {
      toast({
        title: "No model selected",
        description: "Please select a model first.",
        variant: "destructive",
      });
      return;
    }

    // Create new conversation if none exists
    let convId = currentConversationId;
    if (!convId) {
      convId = await DatabaseService.createConversation({
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        model: selectedModel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setCurrentConversationId(convId);
      await loadConversations();
    } else if (messages.length === 0) {
      await updateConversationTitle(convId, content);
    }

    // Check if current model supports vision
    const isVision = isVisionModel(selectedModel);
    let imageData: string[] | undefined;

    // Encode images if present
    if (uploadedImages.length > 0) {
      try {
        imageData = await Promise.all(
          uploadedImages
            .filter((img) => !img.isProcessing)
            .map((img) => imageToBase64(img.file))
        );
        console.log("Encoded images:", imageData.length, "images");
      } catch (error) {
        console.error("Failed to encode images:", error);
        toast({
          title: "Image Error",
          description: "Failed to process images",
          variant: "destructive",
        });
      }
    }

    // Prepare file metadata for storage (not the content, just metadata)
    const fileMetadata =
      uploadedFiles.length > 0
        ? uploadedFiles.map((f) => ({
            name: f.name,
            type: f.type,
            typeName: f.typeName,
            size: f.size,
          }))
        : undefined;

    const userMessage: ChatMessageType = {
      role: "user",
      content,
      images: imageData,
      files: fileMetadata,
    };

    // Save user message to database with images and file metadata
    await DatabaseService.addMessage({
      conversation_id: convId,
      role: "user",
      content,
      images: imageData,
      files: fileMetadata,
      created_at: new Date().toISOString(),
    });

    // Prepare messages with memory, search context, OCR text, and custom system prompt
    const memoryContext = await getMemoryContext();
    let systemContext = "";

    // Add custom system prompt if enabled
    if (
      generationOptions.use_custom_system_prompt &&
      generationOptions.system_prompt
    ) {
      systemContext += generationOptions.system_prompt + "\n\n";
    }

    // Add thinking process instruction if enabled
    if (generationOptions.show_thinking) {
      systemContext += `IMPORTANT: Before providing your final answer, show your thinking process in a dedicated section.

Format your response EXACTLY like this:

<thinking>
[Your step-by-step reasoning, analysis, and thought process here]
- Break down the problem
- Consider different angles
- Work through the logic
- Note any assumptions or uncertainties
</thinking>

<answer>
[Your clear, final answer here]
</answer>

The <thinking> section will be displayed in a collapsible block so users can see your reasoning process.

`;
    }

    if (memoryContext) {
      systemContext += memoryContext;
    }

    // For non-vision models, add OCR text as context
    if (!isVision && uploadedImages.length > 0) {
      const ocrTexts = uploadedImages
        .filter((img) => img.extractedText && !img.isProcessing)
        .map((img) => img.extractedText)
        .filter(Boolean);

      if (ocrTexts.length > 0) {
        systemContext +=
          "\n\n=== Text extracted from uploaded images ===\n" +
          ocrTexts.join("\n\n---\n\n");
        console.log("Adding OCR context:", ocrTexts.length, "images");
      }
    }

    // Add uploaded file contents as context
    if (uploadedFiles.length > 0) {
      const processedFiles = uploadedFiles.filter(
        (f) => f.extractedText && !f.isProcessing && !f.error
      );

      if (processedFiles.length > 0) {
        systemContext += "\n\n=== Attached File Contents ===\n\n";
        processedFiles.forEach((file) => {
          systemContext += `--- File: ${file.name} (${file.typeName}) ---\n\n${file.extractedText}\n\n`;
        });
        console.log("Adding file context:", processedFiles.length, "files");
      }
    }

    // RAG: Retrieve relevant documents if enabled
    if (ragEnabled) {
      try {
        const { searchChunksSemantic, searchChunks, formatChunksForContext } =
          await import("./lib/document-parser");
        const allChunks = await DatabaseService.getAllChunks();

        if (allChunks.length > 0) {
          // Try semantic search first (if embeddings exist), fall back to keyword search
          const hasEmbeddings = allChunks.some(
            (chunk) => chunk.embedding && chunk.embedding.length > 0
          );
          const relevantChunks = hasEmbeddings
            ? await searchChunksSemantic(allChunks as any, content, 5)
            : searchChunks(allChunks as any, content, 5);

          if (relevantChunks.length > 0) {
            // Get document names
            const documents = await DatabaseService.getDocuments();
            const docMap = new Map(documents.map((d) => [d.id!, d.name]));

            // Group chunks by document
            const chunksByDoc = relevantChunks.reduce((acc, chunk) => {
              const docName = docMap.get(chunk.documentId) || "Unknown";
              if (!acc[docName]) acc[docName] = [];
              acc[docName].push(chunk);
              return acc;
            }, {} as Record<string, typeof relevantChunks>);

            // Format context for each document
            Object.entries(chunksByDoc).forEach(([docName, chunks]) => {
              systemContext += "\n\n" + formatChunksForContext(chunks, docName);
            });

            toast({
              title: hasEmbeddings
                ? "RAG Active (Semantic)"
                : "RAG Active (Keyword)",
              description: `Retrieved ${
                relevantChunks.length
              } relevant excerpts from ${
                Object.keys(chunksByDoc).length
              } document(s)`,
            });
          }
        }
      } catch (error) {
        console.error("RAG retrieval failed:", error);
        // Continue without RAG if it fails
      }
    }

    // Deep Research if enabled
    if (deepResearchEnabled) {
      try {
        setIsAutoSearching(true);
        const { performDeepResearch, formatResearchContext } = await import(
          "./lib/deep-research"
        );

        const research = await performDeepResearch(content, (progress) => {
          // Could show progress toast here
          console.log(
            `Research progress: ${progress.currentStep}/${progress.totalSteps}`
          );
        });

        if (research.status === "completed" && research.finalReport) {
          systemContext += "\n\n" + formatResearchContext(research);

          toast({
            title: "Deep Research Complete",
            description: `Gathered information from ${
              research.steps.filter((s) => s.status === "completed").length
            } research angles`,
          });
        }
      } catch (error) {
        console.error("Deep research failed:", error);
        toast({
          title: "Deep Research Failed",
          description: "Continuing with regular search...",
          variant: "destructive",
        });
      } finally {
        setIsAutoSearching(false);
      }
    } else if (autoSearchEnabled) {
      // Auto-search if enabled (and deep research is not)
      try {
        setIsAutoSearching(true);
        const searchResult = await autoSearch(content);

        if (searchResult.shouldSearch && searchResult.results) {
          const autoContext = formatAutoSearchContext(
            content,
            searchResult.results
          );
          systemContext += "\n\n" + autoContext;

          toast({
            title: "Auto-Search Complete",
            description: `Found ${searchResult.results.results.length} results for: "${searchResult.query}"`,
          });
        }
      } catch (error) {
        console.error("Auto-search failed:", error);
        // Continue without search if it fails
      } finally {
        setIsAutoSearching(false);
      }
    }

    // Manual search context (if any)
    if (searchContext) {
      systemContext += "\n\n" + searchContext;
      // Clear search context after use
      setSearchContext("");
    }

    const messagesWithContext = [...messages, userMessage];

    // Add system message with context if any exists
    const messagesToSend: ChatMessageType[] = systemContext
      ? [{ role: "system", content: systemContext }, ...messagesWithContext]
      : messagesWithContext;

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Clear uploaded images and files after sending (with proper cleanup)
    uploadedImages.forEach((img) => {
      URL.revokeObjectURL(img.preview);
    });
    setUploadedImages([]);
    setUploadedFiles([]);

    setIsGenerating(true);
    setCurrentResponse("");

    // Scroll to bottom to show loading indicator
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);

    try {
      abortControllerRef.current = new AbortController();
      let fullResponse = "";

      for await (const chunk of chatStream({
        model: selectedModel,
        messages: messagesToSend,
        images: imageData, // Include images for vision models
        signal: abortControllerRef.current.signal,
        options: {
          temperature: generationOptions.temperature,
          num_predict: generationOptions.max_tokens,
          top_p: generationOptions.top_p,
          top_k: generationOptions.top_k,
          repeat_penalty: generationOptions.repeat_penalty,
        },
      })) {
        fullResponse += chunk;
        setCurrentResponse(fullResponse);
      }

      // Save assistant message to database
      await DatabaseService.addMessage({
        conversation_id: convId,
        role: "assistant",
        content: fullResponse,
        created_at: new Date().toISOString(),
      });

      const assistantMessage: ChatMessageType = {
        role: "assistant",
        content: fullResponse,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      setCurrentResponse("");
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description:
          "Failed to generate response. Make sure Ollama is running.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentResponse("");
      abortControllerRef.current = null;
    }
  };

  const handleStop = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);

      toast({
        title: "Generation Stopped",
        description: "Response generation was cancelled",
      });

      // Save partial response
      if (currentResponse && currentConversationId) {
        await DatabaseService.addMessage({
          conversation_id: currentConversationId,
          role: "assistant",
          content: currentResponse + " [Stopped]",
          created_at: new Date().toISOString(),
        });

        const assistantMessage: ChatMessageType = {
          role: "assistant",
          content: currentResponse + " [Stopped]",
        };
        const finalMessages = [...messages, assistantMessage];
        setMessages(finalMessages);
        setCurrentResponse("");
      }
    }
  };

  const handleEditMessage = async (index: number, newContent: string) => {
    if (!currentConversationId) return;

    // Remove messages from the edited index onwards
    const messagesToKeep = messages.slice(0, index);
    setMessages(messagesToKeep);

    // Delete messages from database
    await DatabaseService.deleteMessages(currentConversationId);
    for (const msg of messagesToKeep) {
      await DatabaseService.addMessage({
        conversation_id: currentConversationId,
        role: msg.role,
        content: msg.content,
        images: msg.images,
        files: msg.files,
        created_at: new Date().toISOString(),
      });
    }

    // Send the edited message
    await handleSendMessage(newContent);
  };

  const handleRegenerateMessage = async (fromIndex: number) => {
    if (!currentConversationId) return;

    // Get the user message before the assistant response
    const userMessageIndex = fromIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== "user")
      return;

    // Remove messages from the assistant message index onwards
    const messagesToKeep = messages.slice(0, fromIndex);
    setMessages(messagesToKeep);

    // Delete and re-save messages to database
    await DatabaseService.deleteMessages(currentConversationId);
    for (const msg of messagesToKeep) {
      await DatabaseService.addMessage({
        conversation_id: currentConversationId,
        role: msg.role,
        content: msg.content,
        images: msg.images,
        files: msg.files,
        created_at: new Date().toISOString(),
      });
    }

    // Regenerate from the last user message
    const lastUserMessage = messages[userMessageIndex];
    await handleSendMessage(lastUserMessage.content);
  };

  const handleDeleteMessage = async (index: number) => {
    if (!currentConversationId) return;

    // Remove the message
    const updatedMessages = messages.filter((_, idx) => idx !== index);
    setMessages(updatedMessages);

    // Update database
    await DatabaseService.deleteMessages(currentConversationId);
    for (const msg of updatedMessages) {
      await DatabaseService.addMessage({
        conversation_id: currentConversationId,
        role: msg.role,
        content: msg.content,
        images: msg.images,
        files: msg.files,
        created_at: new Date().toISOString(),
      });
    }

    toast({
      title: "Message Deleted",
      description: "Message removed from conversation",
    });
  };

  const handleCopyMessage = (content: string) => {
    // Toast is handled in MessageActions component
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={createNewChat}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenMemories={() => setIsMemoryManagerOpen(true)}
        onOpenDataExport={() => setIsDataExportOpen(true)}
        onOpenSearchSettings={() => setIsSearchSettingsOpen(true)}
        onOpenModelManager={() => setIsModelManagerOpen(true)}
        onOpenGenerationSettings={() => setIsGenerationSettingsOpen(true)}
        onOpenDocuments={() => setIsDocumentManagerOpen(true)}
        onOpenDeepResearch={() => setIsDeepResearchOpen(true)}
        onOpenKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogoIcon size={28} />
                <h2 className="text-lg font-semibold">
                  {currentConversationId
                    ? conversations.find((c) => c.id === currentConversationId)
                        ?.title || "Chat"
                    : "Welcome to SymChat"}
                </h2>
              </div>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onNoModels={() => setIsModelManagerOpen(true)}
              />
            </div>
            {/* Generation Settings Indicator */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Temp: {generationOptions.temperature.toFixed(1)}</span>
              <span>•</span>
              <span>Max: {generationOptions.max_tokens}</span>
              <span>•</span>
              <span>Top-P: {generationOptions.top_p.toFixed(2)}</span>
              {generationOptions.use_custom_system_prompt && (
                <>
                  <span>•</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setIsGenerationSettingsOpen(true)}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline-offset-2 hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          Custom Prompt Active
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="text-xs font-mono">
                          {generationOptions.system_prompt.length > 100
                            ? `${generationOptions.system_prompt.substring(
                                0,
                                100
                              )}...`
                            : generationOptions.system_prompt ||
                              "No prompt set"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Click to view/edit in settings
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="max-w-4xl mx-auto p-4 space-y-4">
            {messages.length === 0 && !currentResponse ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <LogoIcon size={80} className="mb-6" />
                <h3 className="text-2xl font-bold mb-2">Welcome to SymChat</h3>
                <p className="text-muted-foreground max-w-md">
                  Start a conversation with your AI assistant. Ask questions,
                  get help with coding, or just chat about anything!
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    role={msg.role}
                    content={msg.content}
                    images={msg.images}
                    files={msg.files}
                    messageIndex={idx}
                    onEdit={handleEditMessage}
                    onRegenerate={handleRegenerateMessage}
                    onDelete={handleDeleteMessage}
                    onCopy={handleCopyMessage}
                  />
                ))}
                {isGenerating && (
                  <ChatMessage
                    role="assistant"
                    content={currentResponse}
                    isGenerating={true}
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background p-4">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* File previews */}
            {uploadedFiles.length > 0 && (
              <FileUpload
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                disabled={isGenerating}
              />
            )}

            {/* Image previews */}
            {uploadedImages.length > 0 && (
              <div className="space-y-2">
                <ImageUpload
                  images={uploadedImages}
                  onImagesChange={setUploadedImages}
                  disabled={isGenerating}
                  skipOCR={isVisionModel(selectedModel)}
                />
                {isVisionModel(selectedModel) && (
                  <div className="text-xs px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-700 dark:text-purple-400 font-medium">
                    👁️ Vision model - Images will be sent directly for analysis
                  </div>
                )}
              </div>
            )}

            <ChatInput
              ref={chatInputRef}
              onSend={handleSendMessage}
              onStop={handleStop}
              disabled={isGenerating || isAutoSearching}
              isGenerating={isGenerating}
              autoSearchEnabled={autoSearchEnabled}
              onToggleAutoSearch={() =>
                setAutoSearchEnabled(!autoSearchEnabled)
              }
              isAutoSearching={isAutoSearching}
              onImageUpload={handleImageUploadInline}
              onFileUpload={handleFileUploadInline}
              isVisionModel={isVisionModel(selectedModel)}
              deepResearchEnabled={deepResearchEnabled}
              onToggleDeepResearch={() =>
                setDeepResearchEnabled(!deepResearchEnabled)
              }
            />

            {/* Status messages */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {ragEnabled && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <FileText className="h-3 w-3" />
                  RAG enabled (auto)
                </span>
              )}
              {deepResearchEnabled && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  {ragEnabled && <span>•</span>}
                  <Brain className="h-3 w-3" />
                  Deep Research enabled
                </span>
              )}
              {autoSearchEnabled && (
                <span className="flex items-center gap-1">
                  {(ragEnabled || deepResearchEnabled) && <span>•</span>}
                  <Globe className="h-3 w-3" />
                  Auto Search enabled
                </span>
              )}
              {uploadedFiles.length > 0 && (
                <span>
                  {(ragEnabled || autoSearchEnabled || deepResearchEnabled) && (
                    <span>•</span>
                  )}{" "}
                  {uploadedFiles.length} file
                  {uploadedFiles.length !== 1 ? "s" : ""} attached
                </span>
              )}
              {uploadedImages.length > 0 && (
                <span>
                  {(ragEnabled ||
                    autoSearchEnabled ||
                    deepResearchEnabled ||
                    uploadedFiles.length > 0) && <span>•</span>}{" "}
                  {uploadedImages.length} image
                  {uploadedImages.length !== 1 ? "s" : ""} ready
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <MemoryManager
        isOpen={isMemoryManagerOpen}
        onClose={() => setIsMemoryManagerOpen(false)}
      />

      <ModelManager
        isOpen={isModelManagerOpen}
        onClose={() => setIsModelManagerOpen(false)}
      />

      <DataExport
        isOpen={isDataExportOpen}
        onClose={() => setIsDataExportOpen(false)}
      />

      <SearchSettings
        isOpen={isSearchSettingsOpen}
        onClose={() => setIsSearchSettingsOpen(false)}
      />

      <GenerationSettings
        isOpen={isGenerationSettingsOpen}
        onClose={() => setIsGenerationSettingsOpen(false)}
        options={generationOptions}
        onOptionsChange={setGenerationOptions}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
      />

      <DocumentManager
        isOpen={isDocumentManagerOpen}
        onClose={() => {
          setIsDocumentManagerOpen(false);
          // Re-check documents when manager closes
          checkAndEnableRAG();
        }}
      />

      <DeepResearch
        isOpen={isDeepResearchOpen}
        onClose={() => setIsDeepResearchOpen(false)}
        onUseResearch={(report) => {
          // Add research report to search context
          setSearchContext(report);
          toast({
            title: "Research Added",
            description: "Deep research results added as context",
          });
        }}
      />

      <KeyboardShortcutsDialog
        open={isKeyboardShortcutsOpen}
        onOpenChange={setIsKeyboardShortcutsOpen}
      />

      <PromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onUseTemplate={(prompt) => {
          setGenerationOptions({
            ...generationOptions,
            use_custom_system_prompt: true,
            system_prompt: prompt,
          });
        }}
      />

      <Toaster />
    </div>
  );
}

export default App;
