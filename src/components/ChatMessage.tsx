import { Avatar, AvatarFallback } from './ui/avatar'
import { Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { CodePreview } from './CodePreview'
import { MultiFilePreview } from './MultiFilePreview'
import { TypingIndicator } from './TypingIndicator'
import { FileAttachment } from './FileAttachment'
import { cn } from '@/lib/utils'
import type { Components } from 'react-markdown'
import { useMemo } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  files?: Array<{ name: string; type: string; typeName: string; size: number }>
  isGenerating?: boolean
}

interface CodeBlock {
  language: string
  code: string
}

export function ChatMessage({ role, content, images, files, isGenerating }: ChatMessageProps) {
  const isUser = role === 'user'

  // Extract all code blocks from the message
  const codeBlocks = useMemo(() => {
    const blocks: CodeBlock[] = []
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g
    let match
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1].toLowerCase(),
        code: match[2].trim()
      })
    }
    
    return blocks
  }, [content])

  // Check if we have multiple web-related code blocks
  const hasMultipleWebFiles = useMemo(() => {
    const webLanguages = codeBlocks.filter(block => 
      ['html', 'htm', 'css', 'javascript', 'js'].includes(block.language)
    )
    return webLanguages.length > 1
  }, [codeBlocks])

  // Custom components for ReactMarkdown to add code preview
  const components: Components = {
    code(props) {
      const { node, inline, className, children, ...rest } = props as any
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      const code = String(children).replace(/\n$/, '')
      
      // For inline code, just render normally
      if (inline) {
        return (
          <code className={className} {...rest}>
            {children}
          </code>
        )
      }

      // For code blocks, add preview button for web languages
      const isWebCode = ['html', 'htm', 'xml', 'css', 'javascript', 'js'].includes(
        language.toLowerCase()
      )

      return (
        <div className="relative">
          <pre className={cn('overflow-x-auto', className)}>
            <code {...rest}>{children}</code>
          </pre>
          {isWebCode && <CodePreview code={code} language={language} />}
        </div>
      )
    },
  }

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-colors',
        isUser ? 'bg-primary/5' : 'bg-muted/50'
      )}
    >
      <Avatar className={cn(
        'h-8 w-8 flex-shrink-0',
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-blue-500/20' 
          : 'bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-emerald-500/20'
      )}>
        <AvatarFallback className={cn(
          'text-white font-semibold',
          isUser ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        )}>
          {isUser ? (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-xs font-bold">You</span>
            </div>
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2 overflow-hidden">
          <div className="font-semibold text-sm">
            {isUser ? 'You' : 'Assistant'}
          </div>
          
              {/* Display attached files if present */}
              {files && files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {files.map((file, idx) => (
                    <FileAttachment
                      key={idx}
                      name={file.name}
                      type={file.type}
                      typeName={file.typeName}
                      size={file.size}
                    />
                  ))}
                </div>
              )}

              {/* Display images if present */}
              {images && images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={`data:image/png;base64,${img}`}
                      alt={`Uploaded image ${idx + 1}`}
                      className="max-w-xs max-h-64 rounded-lg border shadow-sm object-contain cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        // Open in new tab for full view
                        const win = window.open()
                        if (win) {
                          win.document.write(`<img src="data:image/png;base64,${img}" style="max-width:100%; height:auto;" />`)
                        }
                      }}
                    />
                  ))}
                </div>
              )}
          
          {/* Show typing indicator when generating with no content yet */}
          {isGenerating && !content ? (
            <TypingIndicator />
          ) : (
            <>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown components={components}>{content}</ReactMarkdown>
              </div>
              {/* Show combined preview button if multiple web files detected */}
              {hasMultipleWebFiles && !isUser && (
                <MultiFilePreview codeBlocks={codeBlocks} />
              )}
            </>
          )}
      </div>
    </div>
  )
}

