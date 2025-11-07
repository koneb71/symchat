import { db } from './database'
import type { Conversation, Message } from './database'

/**
 * Export a single conversation with its messages
 */
export interface ExportedConversation {
  conversation: Conversation
  messages: Message[]
  exportedAt: string
  version: string
}

/**
 * Export conversation as JSON
 */
export async function exportConversationAsJSON(conversationId: string): Promise<string> {
  const conversation = await db.conversations.get(conversationId)

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  const messages = await db.messages
    .where('conversation_id')
    .equals(conversationId)
    .sortBy('created_at')

  const exportData: ExportedConversation = {
    conversation,
    messages,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export conversation as Markdown
 */
export async function exportConversationAsMarkdown(conversationId: string): Promise<string> {
  const conversation = await db.conversations.get(conversationId)

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  const messages = await db.messages
    .where('conversation_id')
    .equals(conversationId)
    .sortBy('created_at')

  let markdown = `# ${conversation.title}\n\n`
  markdown += `**Model:** ${conversation.model}\n`
  markdown += `**Created:** ${new Date(conversation.created_at).toLocaleString()}\n`
  markdown += `**Updated:** ${new Date(conversation.updated_at).toLocaleString()}\n\n`
  markdown += `---\n\n`

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? 'You' : 'Assistant'
    const timestamp = new Date(message.created_at).toLocaleString()

    markdown += `## ${role} (${timestamp})\n\n`

    // Add attached files info
    if (message.files && message.files.length > 0) {
      markdown += `**Attached Files:**\n`
      message.files.forEach(file => {
        markdown += `- ${file.name} (${file.typeName}, ${formatBytes(file.size)})\n`
      })
      markdown += `\n`
    }

    // Add images info
    if (message.images && message.images.length > 0) {
      markdown += `**Images:** ${message.images.length} attached\n\n`
    }

    markdown += `${message.content}\n\n`

    if (index < messages.length - 1) {
      markdown += `---\n\n`
    }
  })

  markdown += `\n---\n\n`
  markdown += `*Exported from SymChat on ${new Date().toLocaleString()}*\n`

  return markdown
}

/**
 * Export conversation as plain text
 */
export async function exportConversationAsText(conversationId: string): Promise<string> {
  const conversation = await db.conversations.get(conversationId)

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  const messages = await db.messages
    .where('conversation_id')
    .equals(conversationId)
    .sortBy('created_at')

  let text = `${conversation.title}\n`
  text += `Model: ${conversation.model}\n`
  text += `Created: ${new Date(conversation.created_at).toLocaleString()}\n`
  text += `Updated: ${new Date(conversation.updated_at).toLocaleString()}\n`
  text += `${'='.repeat(80)}\n\n`

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? 'You' : 'Assistant'
    const timestamp = new Date(message.created_at).toLocaleString()

    text += `[${role}] ${timestamp}\n`

    if (message.files && message.files.length > 0) {
      text += `Attached Files: ${message.files.map(f => f.name).join(', ')}\n`
    }

    if (message.images && message.images.length > 0) {
      text += `Images: ${message.images.length} attached\n`
    }

    text += `\n${message.content}\n`
    text += `${'-'.repeat(80)}\n\n`
  })

  text += `\nExported from SymChat on ${new Date().toLocaleString()}\n`

  return text
}

/**
 * Export conversation as HTML
 */
export async function exportConversationAsHTML(conversationId: string): Promise<string> {
  const conversation = await db.conversations.get(conversationId)

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  const messages = await db.messages
    .where('conversation_id')
    .equals(conversationId)
    .sortBy('created_at')

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(conversation.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      line-height: 1.6;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 15px 0;
    }
    .metadata {
      font-size: 14px;
      opacity: 0.9;
    }
    .message {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .message.user {
      border-left: 4px solid #667eea;
    }
    .message.assistant {
      border-left: 4px solid #764ba2;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .role {
      font-weight: 600;
      font-size: 16px;
    }
    .role.user { color: #667eea; }
    .role.assistant { color: #764ba2; }
    .timestamp {
      font-size: 12px;
      color: #666;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .attachments {
      background: #f9f9f9;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(conversation.title)}</h1>
    <div class="metadata">
      <div><strong>Model:</strong> ${escapeHtml(conversation.model)}</div>
      <div><strong>Created:</strong> ${new Date(conversation.created_at).toLocaleString()}</div>
      <div><strong>Updated:</strong> ${new Date(conversation.updated_at).toLocaleString()}</div>
    </div>
  </div>
`

  messages.forEach(message => {
    const role = message.role === 'user' ? 'You' : 'Assistant'
    const roleClass = message.role
    const timestamp = new Date(message.created_at).toLocaleString()

    html += `  <div class="message ${roleClass}">
    <div class="message-header">
      <span class="role ${roleClass}">${role}</span>
      <span class="timestamp">${timestamp}</span>
    </div>
`

    if (message.files && message.files.length > 0) {
      html += `    <div class="attachments">
      <strong>📎 Attached Files:</strong><br>
      ${message.files.map(f => `${escapeHtml(f.name)} (${f.typeName}, ${formatBytes(f.size)})`).join('<br>')}
    </div>
`
    }

    if (message.images && message.images.length > 0) {
      html += `    <div class="attachments">
      <strong>🖼️ Images:</strong> ${message.images.length} attached
    </div>
`
    }

    html += `    <div class="content">${escapeHtml(message.content)}</div>
  </div>
`
  })

  html += `  <div class="footer">
    Exported from SymChat on ${new Date().toLocaleString()}
  </div>
</body>
</html>`

  return html
}

/**
 * Download conversation in specified format
 */
export async function downloadConversation(
  conversationId: string,
  format: 'json' | 'markdown' | 'text' | 'html'
) {
  const conversation = await db.conversations.get(conversationId)

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  let content: string
  let mimeType: string
  let extension: string

  switch (format) {
    case 'json':
      content = await exportConversationAsJSON(conversationId)
      mimeType = 'application/json'
      extension = 'json'
      break
    case 'markdown':
      content = await exportConversationAsMarkdown(conversationId)
      mimeType = 'text/markdown'
      extension = 'md'
      break
    case 'text':
      content = await exportConversationAsText(conversationId)
      mimeType = 'text/plain'
      extension = 'txt'
      break
    case 'html':
      content = await exportConversationAsHTML(conversationId)
      mimeType = 'text/html'
      extension = 'html'
      break
  }

  // Create filename from conversation title
  const sanitizedTitle = conversation.title
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50)
  const filename = `${sanitizedTitle}_${Date.now()}.${extension}`

  // Create and download blob
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Helper function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
