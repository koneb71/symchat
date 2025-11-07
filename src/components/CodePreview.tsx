import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Eye, Code, Maximize2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CodePreviewProps {
  code: string
  language: string
}

export function CodePreview({ code, language }: CodePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const isWebCode = ['html', 'htm', 'xml'].includes(language.toLowerCase())
  const isCss = language.toLowerCase() === 'css'
  const isJs = ['javascript', 'js'].includes(language.toLowerCase())

  // Don't show preview button for non-web code
  if (!isWebCode && !isCss && !isJs) {
    return null
  }

  const generatePreviewHtml = () => {
    let html = code

    // If it's CSS, wrap it in style tags and add a demo
    if (isCss) {
      html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      margin: 0;
    }
    ${code}
  </style>
</head>
<body>
  <div class="demo-content">
    <h1>CSS Preview</h1>
    <p>This is a paragraph to demonstrate the styles.</p>
    <button>Button</button>
    <div class="container">
      <div class="box">Box 1</div>
      <div class="box">Box 2</div>
      <div class="box">Box 3</div>
    </div>
  </div>
</body>
</html>
`
    }

    // If it's JS, wrap it in script tags with a basic HTML structure
    if (isJs) {
      html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      margin: 0;
    }
    #output {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
      white-space: pre-wrap;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h1>JavaScript Preview</h1>
  <div id="root"></div>
  <div id="output"></div>
  <script>
    // Override console.log to show output
    const output = document.getElementById('output');
    const originalLog = console.log;
    console.log = function(...args) {
      output.textContent += args.join(' ') + '\\n';
      originalLog.apply(console, args);
    };
    
    // User code
    try {
      ${code}
    } catch (error) {
      output.textContent = 'Error: ' + error.message;
      output.style.color = 'red';
    }
  </script>
</body>
</html>
`
    }

    // If it's HTML but doesn't have doctype, wrap it
    if (isWebCode && !code.toLowerCase().includes('<!doctype')) {
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>
`
    }

    return html
  }

  const handlePreview = () => {
    setIsPreviewOpen(true)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard',
    })
  }

  const getLanguageLabel = () => {
    if (isCss) return 'CSS'
    if (isJs) return 'JavaScript'
    return 'HTML'
  }

  return (
    <>
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          className="text-xs"
        >
          <Eye className="h-3 w-3 mr-1" />
          Preview {getLanguageLabel()}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCode}
          className="text-xs"
        >
          <Code className="h-3 w-3 mr-1" />
          Copy Code
        </Button>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none flex flex-col p-0 gap-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <DialogTitle className="sr-only">{getLanguageLabel()} Preview - Live rendering in secure sandbox</DialogTitle>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur-sm border-b shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{getLanguageLabel()} Preview</h2>
                <p className="text-xs text-muted-foreground">Live rendering in secure sandbox</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCode(!showCode)}
              className="shadow-sm"
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

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            {showCode ? (
              <div className="h-full rounded-xl border bg-slate-950 shadow-2xl overflow-hidden">
                <div className="h-full overflow-auto">
                  <pre className="p-6 text-xs text-slate-100 font-mono">
                    <code>{generatePreviewHtml()}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full rounded-xl border shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
                <iframe
                  srcDoc={generatePreviewHtml()}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-modals allow-forms allow-popups"
                  title="Code Preview"
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
              <span>{showCode ? 'Source code view' : 'Live interactive preview'}</span>
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

