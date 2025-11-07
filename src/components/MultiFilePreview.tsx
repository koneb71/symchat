import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Layers, Code, Maximize2, Eye } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CodeBlock {
  language: string
  code: string
}

interface MultiFilePreviewProps {
  codeBlocks: CodeBlock[]
}

export function MultiFilePreview({ codeBlocks }: MultiFilePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showCode, setShowCode] = useState(false)

  // Extract HTML, CSS, and JS from code blocks
  const htmlBlock = codeBlocks.find(block => 
    ['html', 'htm', 'xml'].includes(block.language)
  )
  const cssBlock = codeBlocks.find(block => block.language === 'css')
  const jsBlock = codeBlocks.find(block => ['javascript', 'js'].includes(block.language))

  // Don't show if we don't have at least 2 web files
  const webBlocks = [htmlBlock, cssBlock, jsBlock].filter(Boolean)
  if (webBlocks.length < 2) {
    return null
  }

  const generateCombinedHtml = () => {
    let html = htmlBlock?.code || ''
    const css = cssBlock?.code || ''
    const js = jsBlock?.code || ''

    // If HTML doesn't have doctype, it's probably a snippet
    const isFullHtml = html.toLowerCase().includes('<!doctype') || 
                       html.toLowerCase().includes('<html')

    if (isFullHtml) {
      // Insert CSS and JS into existing HTML
      if (css) {
        // Try to insert CSS in head, or before </head>, or after <head>
        if (html.includes('</head>')) {
          html = html.replace('</head>', `  <style>\n${css}\n  </style>\n</head>`)
        } else if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>\n  <style>\n${css}\n  </style>`)
        } else {
          // Add head with style
          html = html.replace('<html>', `<html>\n<head>\n  <style>\n${css}\n  </style>\n</head>`)
        }
      }

      if (js) {
        // Try to insert JS before </body>, or at the end
        if (html.includes('</body>')) {
          html = html.replace('</body>', `  <script>\n${js}\n  </script>\n</body>`)
        } else if (html.includes('</html>')) {
          html = html.replace('</html>', `  <script>\n${js}\n  </script>\n</html>`)
        } else {
          html += `\n<script>\n${js}\n</script>`
        }
      }
    } else {
      // Build complete HTML from scratch
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  ${css ? `<style>\n${css}\n  </style>` : ''}
</head>
<body>
${html}
${js ? `<script>\n${js}\n  </script>` : ''}
</body>
</html>
`
    }

    return html
  }

  const handlePreview = () => {
    setIsPreviewOpen(true)
  }

  const handleCopyAll = () => {
    const combined = `<!-- HTML -->\n${htmlBlock?.code || ''}\n\n` +
                    `/* CSS */\n${cssBlock?.code || ''}\n\n` +
                    `// JavaScript\n${jsBlock?.code || ''}`
    navigator.clipboard.writeText(combined)
    toast({
      title: 'Copied!',
      description: 'All code files copied to clipboard',
    })
  }

  const getFileCount = () => {
    const files = []
    if (htmlBlock) files.push('HTML')
    if (cssBlock) files.push('CSS')
    if (jsBlock) files.push('JS')
    return files.join(' + ')
  }

  return (
    <>
      <div className="flex gap-2 mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex-1 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Layers className="h-4 w-4" />
          <span className="font-medium">Multiple files detected: {getFileCount()}</span>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handlePreview}
          className="text-xs bg-blue-600 hover:bg-blue-700"
        >
          <Eye className="h-3 w-3 mr-1" />
          Preview Combined
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          className="text-xs"
        >
          <Code className="h-3 w-3 mr-1" />
          Copy All
        </Button>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none flex flex-col p-0 gap-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <DialogTitle className="sr-only">Combined Preview - {getFileCount()} files - Live rendering</DialogTitle>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur-sm border-b shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Combined Preview</h2>
                <p className="text-xs text-muted-foreground">{getFileCount()} • Live rendering</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 border">
                {htmlBlock && (
                  <div className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium">
                    HTML
                  </div>
                )}
                {cssBlock && (
                  <div className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                    CSS
                  </div>
                )}
                {jsBlock && (
                  <div className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                    JS
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className="shadow-sm mr-4"
              >
                {showCode ? (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Show Preview
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    View Source
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            {showCode ? (
              <div className="h-full overflow-auto">
                <div className="space-y-4 max-w-5xl mx-auto">
                  {htmlBlock && (
                    <div className="rounded-xl border shadow-lg overflow-hidden bg-slate-950">
                      <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-xs font-semibold text-orange-400">HTML</span>
                      </div>
                      <pre className="p-4 text-xs text-slate-100 font-mono overflow-auto max-h-64">
                        <code>{htmlBlock.code}</code>
                      </pre>
                    </div>
                  )}
                  {cssBlock && (
                    <div className="rounded-xl border shadow-lg overflow-hidden bg-slate-950">
                      <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-semibold text-blue-400">CSS</span>
                      </div>
                      <pre className="p-4 text-xs text-slate-100 font-mono overflow-auto max-h-64">
                        <code>{cssBlock.code}</code>
                      </pre>
                    </div>
                  )}
                  {jsBlock && (
                    <div className="rounded-xl border shadow-lg overflow-hidden bg-slate-950">
                      <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs font-semibold text-yellow-400">JavaScript</span>
                      </div>
                      <pre className="p-4 text-xs text-slate-100 font-mono overflow-auto max-h-64">
                        <code>{jsBlock.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full rounded-xl border shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
                <iframe
                  srcDoc={generateCombinedHtml()}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-modals allow-forms allow-popups"
                  title="Combined Code Preview"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center px-6 py-3 bg-background/95 backdrop-blur-sm border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>{showCode ? 'Viewing source files' : 'Live interactive preview'}</span>
              <span className="mx-2">•</span>
              <kbd className="px-2 py-1 bg-muted rounded border text-[10px]">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

