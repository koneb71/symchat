import { useEffect, useCallback } from 'react'

/**
 * Keyboard shortcuts hook
 * Provides global keyboard shortcuts for the application
 */

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  callback: (event: KeyboardEvent) => void
  description: string
  global?: boolean // If true, works even when input is focused
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  preventDefault?: boolean
}

/**
 * Register keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Check if user is typing in an input/textarea
      const target = event.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      for (const shortcut of shortcuts) {
        // Skip if input is focused and shortcut is not global
        if (isInput && !shortcut.global) continue

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey
        const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
        const metaMatch = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey

        if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
          if (preventDefault) {
            event.preventDefault()
          }
          shortcut.callback(event)
          break
        }
      }
    },
    [shortcuts, enabled, preventDefault]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Get keyboard shortcut display string
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.metaKey) parts.push('⌘')

  parts.push(shortcut.key.toUpperCase())

  return parts.join('+')
}

/**
 * Common keyboard shortcuts
 */
export const COMMON_SHORTCUTS = {
  NEW_CHAT: {
    key: 'k',
    ctrlKey: true,
    description: 'New chat',
  },
  TOGGLE_SIDEBAR: {
    key: 'b',
    ctrlKey: true,
    description: 'Toggle sidebar',
  },
  SEARCH: {
    key: '/',
    ctrlKey: true,
    description: 'Search conversations',
  },
  EXPORT: {
    key: 'e',
    ctrlKey: true,
    description: 'Export current conversation',
  },
  SETTINGS: {
    key: ',',
    ctrlKey: true,
    description: 'Open settings',
  },
  FOCUS_INPUT: {
    key: 'l',
    ctrlKey: true,
    description: 'Focus message input',
  },
  ESCAPE: {
    key: 'Escape',
    description: 'Close modal or cancel',
    global: true,
  },
  DELETE: {
    key: 'Delete',
    ctrlKey: true,
    description: 'Delete current conversation',
  },
  HELP: {
    key: '?',
    shiftKey: true,
    description: 'Show keyboard shortcuts',
    global: true,
  },
} as const
