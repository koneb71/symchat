import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import { DatabaseService } from '@/lib/database'
import { 
  parseDocument, 
  chunkText, 
  isSupportedFileType, 
  getFileTypeName,
  SUPPORTED_FORMATS 
} from '@/lib/document-parser'
import {
  FileText,
  Upload,
  Trash2,
  X,
  Loader2,
  File,
  Calendar,
  Hash,
  CheckCircle2,
} from 'lucide-react'

interface DocumentManagerProps {
  isOpen: boolean
  onClose: () => void
}

interface DocumentItem {
  id: string
  name: string
  text: string
  pageCount: number
  size: number
  uploadedAt: string
}

export function DocumentManager({ isOpen, onClose }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadDocuments()
    }
  }, [isOpen])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await DatabaseService.getDocuments()
      setDocuments(docs as DocumentItem[])
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    for (const file of Array.from(files)) {
      // Check if file type is supported
      if (!isSupportedFileType(file)) {
        toast({
          title: 'Unsupported file type',
          description: `${file.name} format is not supported`,
          variant: 'destructive',
        })
        continue
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 50MB limit`,
          variant: 'destructive',
        })
        continue
      }

      try {
        // Parse document (supports multiple formats)
        const { text, pageCount } = await parseDocument(file)
        const fileTypeName = getFileTypeName(file)

        // Create document
        const docId = await DatabaseService.addDocument({
          name: file.name,
          text,
          pageCount,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        })

        // Create and store chunks
        const chunks = chunkText(text, docId)
        await DatabaseService.addChunks(chunks)

        toast({
          title: 'Document Added',
          description: `${file.name} (${fileTypeName}, ${chunks.length} chunks)`,
        })
      } catch (error: any) {
        console.error('Failed to process document:', error)
        toast({
          title: 'Processing Failed',
          description: error.message || `Failed to process ${file.name}`,
          variant: 'destructive',
        })
      }
    }

    // Clear input and reload
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setUploading(false)
    loadDocuments()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
      return
    }

    try {
      await DatabaseService.deleteDocument(id)
      toast({
        title: 'Document Deleted',
        description: `${name} has been removed`,
      })
      loadDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete document',
        variant: 'destructive',
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Document Manager (RAG)</CardTitle>
                <CardDescription>
                  Upload PDFs to use as context in conversations
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-6 space-y-4">
          {/* Upload Section */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.docx,.xlsx,.csv,.json,.txt,.md,.html,.xml"
              multiple
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing Documents...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Max 50MB per file • Supports PDF, DOCX, XLSX, CSV, JSON, TXT, MD, HTML, XML
            </p>
          </div>

          {/* Supported Formats Info */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Supported Formats
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.values(SUPPORTED_FORMATS).map((format) => (
                <div key={format.ext} className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span>{format.name}</span>
                  <span className="text-muted-foreground">({format.ext})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              Uploaded Documents ({documents.length})
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <File className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No documents uploaded yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload documents to use them as context in your conversations
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] border rounded-lg">
                <div className="p-2 space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                          <h4 className="font-medium text-sm truncate">
                            {doc.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {doc.pageCount} pages
                          </span>
                          <span>{formatFileSize(doc.size)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.uploadedAt)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id!, doc.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              How RAG Works
            </h4>
            <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
              <p>• Documents are automatically chunked for better retrieval</p>
              <p>• Relevant sections are retrieved based on your questions</p>
              <p>• Context is added to your conversation automatically</p>
              <p>• Enable RAG toggle in chat to use document context</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

