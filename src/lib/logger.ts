/**
 * Logging utility with environment-aware log levels
 *
 * Usage:
 * import { logger } from '@/lib/logger'
 *
 * logger.debug('Debug message', { data })
 * logger.info('Info message')
 * logger.warn('Warning message')
 * logger.error('Error message', error)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LoggerConfig {
  level: LogLevel
  enableTimestamp: boolean
  enableColors: boolean
  prefix?: string
}

class Logger {
  private config: LoggerConfig

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      // In production, only show warnings and errors
      level: import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG,
      enableTimestamp: true,
      enableColors: true,
      ...config,
    }
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel) {
    this.config.level = level
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level
  }

  /**
   * Format timestamp for log messages
   */
  private formatTimestamp(): string {
    if (!this.config.enableTimestamp) return ''
    const now = new Date()
    return `[${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}]`
  }

  /**
   * Format log message with prefix and timestamp
   */
  private formatMessage(level: string, args: any[]): any[] {
    const timestamp = this.formatTimestamp()
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : ''
    const levelTag = `[${level}]`

    return [timestamp, prefix, levelTag, ...args].filter(Boolean)
  }

  /**
   * Debug level logging (development only)
   */
  debug(...args: any[]) {
    if (this.config.level <= LogLevel.DEBUG) {
      console.log(...this.formatMessage('DEBUG', args))
    }
  }

  /**
   * Info level logging
   */
  info(...args: any[]) {
    if (this.config.level <= LogLevel.INFO) {
      console.info(...this.formatMessage('INFO', args))
    }
  }

  /**
   * Warning level logging
   */
  warn(...args: any[]) {
    if (this.config.level <= LogLevel.WARN) {
      console.warn(...this.formatMessage('WARN', args))
    }
  }

  /**
   * Error level logging
   */
  error(...args: any[]) {
    if (this.config.level <= LogLevel.ERROR) {
      console.error(...this.formatMessage('ERROR', args))
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    })
  }

  /**
   * Group related log messages
   */
  group(label: string, collapsed: boolean = false) {
    if (this.config.level <= LogLevel.DEBUG) {
      if (collapsed) {
        console.groupCollapsed(label)
      } else {
        console.group(label)
      }
    }
  }

  /**
   * End a log group
   */
  groupEnd() {
    if (this.config.level <= LogLevel.DEBUG) {
      console.groupEnd()
    }
  }

  /**
   * Log with performance timing
   */
  time(label: string) {
    if (this.config.level <= LogLevel.DEBUG) {
      console.time(label)
    }
  }

  /**
   * End performance timing
   */
  timeEnd(label: string) {
    if (this.config.level <= LogLevel.DEBUG) {
      console.timeEnd(label)
    }
  }

  /**
   * Log a table (useful for arrays of objects)
   */
  table(data: any) {
    if (this.config.level <= LogLevel.DEBUG) {
      console.table(data)
    }
  }
}

// Create default logger instance
export const logger = new Logger()

// Create specialized loggers for different parts of the app
export const ollamaLogger = logger.child('Ollama')
export const dbLogger = logger.child('Database')
export const ragLogger = logger.child('RAG')
export const searchLogger = logger.child('Search')
export const visionLogger = logger.child('Vision')
export const memoryLogger = logger.child('Memory')

// Export for custom logger creation
export { Logger }

// Helper to set global log level
export function setLogLevel(level: LogLevel | 'debug' | 'info' | 'warn' | 'error' | 'none') {
  const levelMap = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
    none: LogLevel.NONE,
  }

  const numericLevel = typeof level === 'string' ? levelMap[level] : level
  logger.setLevel(numericLevel)
}

// Expose logger to window for debugging (development only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as any).logger = logger
  ;(window as any).setLogLevel = setLogLevel
  ;(window as any).LogLevel = LogLevel
}
