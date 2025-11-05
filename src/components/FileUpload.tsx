import { X, FileText, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  typeName: string
  extractedText?: string
  isProcessing: boolean
  error?: string
}

interface FileUploadProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  disabled?: boolean
}

export function FileUpload({ files, onFilesChange, disabled }: FileUploadProps) {
  const removeFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id)
    onFilesChange(updated)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (file: UploadedFile) => {
    const type = file.type.toLowerCase()
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('docx')) return '📝'
    if (type.includes('excel') || type.includes('xlsx') || type.includes('spreadsheet')) return '📊'
    if (type.includes('csv')) return '📋'
    if (type.includes('json')) return '🔧'
    if (type.includes('text') || type.includes('plain')) return '📃'
    if (type.includes('markdown')) return '📖'
    if (type.includes('html')) return '🌐'
    if (type.includes('xml')) return '📑'
    return '📄'
  }

  if (files.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <FileText className="h-3 w-3" />
        Attached Files ({files.length})
      </div>
      
      <div className="flex flex-wrap gap-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              "relative group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
              file.error
                ? "bg-red-500/10 border-red-500/30"
                : file.isProcessing
                ? "bg-blue-500/10 border-blue-500/30 animate-pulse"
                : "bg-muted/50 border-border hover:bg-muted"
            )}
          >
            {/* File Icon & Info */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl flex-shrink-0">{getFileIcon(file)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate max-w-[200px]" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{file.typeName}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.size)}</span>
                  {file.extractedText && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 dark:text-green-400">
                        ✓ Processed
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Processing Indicator */}
            {file.isProcessing && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
            )}

            {/* Error Indicator */}
            {file.error && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 flex-shrink-0">
                <AlertCircle className="h-3 w-3" />
                <span>Failed</span>
              </div>
            )}

            {/* Remove Button */}
            {!disabled && (
              <button
                onClick={() => removeFile(file.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                title="Remove file"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {files.some(f => f.extractedText) && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded border">
          💡 File contents will be included as context in your message
        </div>
      )}
    </div>
  )
}

