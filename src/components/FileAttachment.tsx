interface FileAttachmentProps {
  name: string
  type: string
  typeName: string
  size: number
}

export function FileAttachment({ name, type, typeName, size }: FileAttachmentProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('pdf')) return '📄'
    if (lowerType.includes('word') || lowerType.includes('docx')) return '📝'
    if (lowerType.includes('excel') || lowerType.includes('xlsx') || lowerType.includes('spreadsheet')) return '📊'
    if (lowerType.includes('csv')) return '📋'
    if (lowerType.includes('json')) return '🔧'
    if (lowerType.includes('text') || lowerType.includes('plain')) return '📃'
    if (lowerType.includes('markdown')) return '📖'
    if (lowerType.includes('html')) return '🌐'
    if (lowerType.includes('xml')) return '📑'
    return '📄'
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors max-w-xs">
      <span className="text-lg flex-shrink-0">{getFileIcon(type)}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate" title={name}>
          {name}
        </div>
        <div className="text-xs text-muted-foreground">
          {typeName} • {formatFileSize(size)}
        </div>
      </div>
    </div>
  )
}

