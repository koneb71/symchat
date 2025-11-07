import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  level?: 'app' | 'component'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    this.setState({
      error,
      errorInfo,
    })

    // TODO: Send to error reporting service in production
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { level = 'component' } = this.props
      const isAppLevel = level === 'app'

      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {isAppLevel ? 'Application Error' : 'Something went wrong'}
                    </h1>
                    <p className="text-white/90 mt-1">
                      {isAppLevel
                        ? 'The application encountered an unexpected error'
                        : 'This component encountered an error and cannot be displayed'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              <div className="p-6 space-y-4">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h2 className="font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Error Details
                  </h2>
                  <p className="text-sm text-red-800 dark:text-red-400 font-mono break-all">
                    {this.state.error?.message || 'Unknown error'}
                  </p>
                </div>

                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <summary className="font-semibold text-slate-900 dark:text-slate-300 cursor-pointer hover:text-slate-700 dark:hover:text-slate-100">
                      Stack Trace (Development Only)
                    </summary>
                    <pre className="mt-3 text-xs text-slate-700 dark:text-slate-400 overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                      {this.state.error?.stack}
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {!isAppLevel && (
                    <Button
                      onClick={this.handleReset}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                  {isAppLevel && (
                    <>
                      <Button
                        onClick={this.handleReload}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reload App
                      </Button>
                      <Button
                        onClick={this.handleGoHome}
                        variant="outline"
                        className="flex-1"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Go Home
                      </Button>
                    </>
                  )}
                </div>

                {/* Help Text */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    If this error persists:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1 list-disc list-inside">
                    <li>Try refreshing the page</li>
                    <li>Clear your browser cache and data</li>
                    <li>Check if Ollama is running (http://localhost:11434)</li>
                    <li>Report this issue on GitHub if it continues</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Convenience wrapper for component-level errors
export function ComponentErrorBoundary({
  children,
  componentName
}: {
  children: ReactNode
  componentName?: string
}) {
  return (
    <ErrorBoundary
      level="component"
      fallback={
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {componentName ? `Error in ${componentName}` : 'Component Error'}
            </span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-500 mt-1">
            This component failed to render. Please try refreshing the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
