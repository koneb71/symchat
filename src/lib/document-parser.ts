import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

// Configure PDF.js worker - use the local bundled version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()
}

export interface PDFDocument {
  id: string
  name: string
  text: string
  pageCount: number
  size: number
  uploadedAt: string
  chunks: DocumentChunk[]
  fileType: string
}

export interface DocumentChunk {
  id?: string
  documentId: string
  text: string
  pageNumber: number
  chunkIndex: number
}

export const SUPPORTED_FORMATS = {
  'application/pdf': { ext: '.pdf', name: 'PDF' },
  'application/json': { ext: '.json', name: 'JSON' },
  'text/plain': { ext: '.txt', name: 'Text' },
  'text/markdown': { ext: '.md', name: 'Markdown' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', name: 'Word' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: '.xlsx', name: 'Excel' },
  'text/csv': { ext: '.csv', name: 'CSV' },
  'application/xml': { ext: '.xml', name: 'XML' },
  'text/xml': { ext: '.xml', name: 'XML' },
  'text/html': { ext: '.html', name: 'HTML' },
}

// Parse PDF file
export async function parsePDF(file: File): Promise<{
  text: string
  pageCount: number
}> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pageCount = pdf.numPages
    
    let fullText = ''
    
    // Extract text from each page
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += `\n\n--- Page ${i} ---\n\n${pageText}`
    }
    
    return {
      text: fullText.trim(),
      pageCount,
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF file')
  }
}

// Parse DOCX file
export async function parseDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error('Failed to parse DOCX file')
  }
}

// Parse Excel file
export async function parseXLSX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)
    
    let fullText = ''
    
    workbook.eachSheet((worksheet, _sheetId) => {
      fullText += `\n\n=== Sheet: ${worksheet.name} ===\n\n`
      
      // Get all rows and convert to CSV-like format
      worksheet.eachRow((row, _rowNumber) => {
        const values = row.values as any[]
        // Skip index 0 (it's undefined in ExcelJS)
        const rowData = values.slice(1).map(cell => {
          if (cell === null || cell === undefined) return ''
          if (typeof cell === 'object' && cell.text) return cell.text
          if (typeof cell === 'object' && cell.result !== undefined) return cell.result
          return String(cell)
        })
        fullText += rowData.join(' | ') + '\n'
      })
    })
    
    return fullText.trim()
  } catch (error) {
    console.error('XLSX parsing error:', error)
    throw new Error('Failed to parse Excel file')
  }
}

// Parse CSV file
export async function parseCSV(file: File): Promise<string> {
  try {
    const text = await file.text()
    const result = Papa.parse(text, { header: true })
    
    // Convert to readable format
    let fullText = '=== CSV Data ===\n\n'
    if (result.data && result.data.length > 0) {
      // Add headers
      const headers = Object.keys(result.data[0] as any)
      fullText += headers.join(' | ') + '\n'
      fullText += headers.map(() => '---').join(' | ') + '\n'
      
      // Add rows
      result.data.forEach((row: any) => {
        fullText += headers.map(h => row[h] || '').join(' | ') + '\n'
      })
    }
    
    return fullText
  } catch (error) {
    console.error('CSV parsing error:', error)
    throw new Error('Failed to parse CSV file')
  }
}

// Parse JSON file
export async function parseJSON(file: File): Promise<string> {
  try {
    const text = await file.text()
    const json = JSON.parse(text)
    
    // Pretty print JSON with descriptions
    const formatted = JSON.stringify(json, null, 2)
    return `=== JSON Content ===\n\n${formatted}`
  } catch (error) {
    console.error('JSON parsing error:', error)
    throw new Error('Failed to parse JSON file')
  }
}

// Parse plain text files (TXT, MD, HTML, XML)
export async function parseText(file: File): Promise<string> {
  try {
    return await file.text()
  } catch (error) {
    console.error('Text parsing error:', error)
    throw new Error('Failed to parse text file')
  }
}

// Main document parser - routes to appropriate parser based on file type
export async function parseDocument(file: File): Promise<{
  text: string
  pageCount: number
}> {
  const fileType = file.type || getTypeFromExtension(file.name)
  
  let text = ''
  let pageCount = 1
  
  try {
    if (fileType === 'application/pdf') {
      const result = await parsePDF(file)
      text = result.text
      pageCount = result.pageCount
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await parseDOCX(file)
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      text = await parseXLSX(file)
    } else if (fileType === 'text/csv') {
      text = await parseCSV(file)
    } else if (fileType === 'application/json') {
      text = await parseJSON(file)
    } else if (
      fileType === 'text/plain' ||
      fileType === 'text/markdown' ||
      fileType === 'text/html' ||
      fileType === 'text/xml' ||
      fileType === 'application/xml'
    ) {
      text = await parseText(file)
    } else {
      throw new Error(`Unsupported file type: ${fileType}`)
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content extracted from document')
    }
    
    return { text, pageCount }
  } catch (error: any) {
    console.error('Document parsing error:', error)
    throw new Error(error.message || 'Failed to parse document')
  }
}

// Get file type from extension if MIME type is not available
function getTypeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const typeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'json': 'application/json',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'html': 'text/html',
    'xml': 'text/xml',
  }
  return typeMap[ext || ''] || 'text/plain'
}

// Check if file type is supported
export function isSupportedFileType(file: File): boolean {
  const fileType = file.type || getTypeFromExtension(file.name)
  return Object.keys(SUPPORTED_FORMATS).includes(fileType)
}

// Get file type display name
export function getFileTypeName(file: File): string {
  const fileType = file.type || getTypeFromExtension(file.name)
  return SUPPORTED_FORMATS[fileType as keyof typeof SUPPORTED_FORMATS]?.name || 'Unknown'
}

// Chunk text into smaller pieces for better retrieval
export function chunkText(
  text: string,
  documentId: string,
  chunkSize: number = 1000,
  overlap: number = 200
): DocumentChunk[] {
  const chunks: DocumentChunk[] = []
  const words = text.split(/\s+/)
  let chunkIndex = 0
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize)
    const chunkText = chunkWords.join(' ')
    
    if (chunkText.trim().length > 0) {
      chunks.push({
        id: `${documentId}-chunk-${chunkIndex}`,
        documentId,
        text: chunkText,
        pageNumber: extractPageNumber(chunkText),
        chunkIndex,
      })
      chunkIndex++
    }
  }
  
  return chunks
}

// Extract page number from chunk text (if it contains page markers)
function extractPageNumber(text: string): number {
  const match = text.match(/--- Page (\d+) ---/)
  return match ? parseInt(match[1]) : 0
}

// Helper function to escape regex special characters
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Simple keyword-based search in chunks
// Keyword-based search (fallback)
export function searchChunks(
  chunks: DocumentChunk[],
  query: string,
  topK: number = 5
): DocumentChunk[] {
  const queryWords = query.toLowerCase().split(/\s+/)

  // Score each chunk based on keyword matches
  const scoredChunks = chunks.map(chunk => {
    const chunkText = chunk.text.toLowerCase()
    let score = 0

    queryWords.forEach(word => {
      // Escape regex special characters to prevent injection
      const escapedWord = escapeRegExp(word)
      const count = (chunkText.match(new RegExp(escapedWord, 'g')) || []).length
      score += count
    })

    return { chunk, score }
  })

  // Sort by score and return top K
  return scoredChunks
    .filter(sc => sc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(sc => sc.chunk)
}

// Semantic search using embeddings (advanced)
export async function searchChunksSemantic(
  chunks: DocumentChunk[],
  query: string,
  topK: number = 5
): Promise<DocumentChunk[]> {
  // Import embeddings lazily
  const { findSimilarTexts } = await import('./embeddings')

  try {
    // Filter chunks that have embeddings
    const chunksWithEmbeddings = chunks.filter(chunk => chunk.embedding && chunk.embedding.length > 0)

    if (chunksWithEmbeddings.length === 0) {
      // Fall back to keyword search if no embeddings
      console.log('No embeddings found, falling back to keyword search')
      return searchChunks(chunks, query, topK)
    }

    // Find similar chunks using embeddings
    const results = await findSimilarTexts(
      query,
      chunksWithEmbeddings.map(chunk => ({
        text: chunk.text,
        embedding: chunk.embedding!,
      })),
      topK
    )

    // Return chunks ordered by similarity
    return results.map(result => chunksWithEmbeddings[result.index])
  } catch (error) {
    console.error('Semantic search failed, falling back to keyword search:', error)
    return searchChunks(chunks, query, topK)
  }
}

// Format chunks for context
export function formatChunksForContext(
  chunks: DocumentChunk[],
  documentName: string
): string {
  if (chunks.length === 0) return ''
  
  let context = `\n\n=== Retrieved from document: ${documentName} ===\n\n`
  
  chunks.forEach((chunk, index) => {
    context += `[Excerpt ${index + 1}${chunk.pageNumber ? ` - Page ${chunk.pageNumber}` : ''}]:\n`
    context += `${chunk.text}\n\n`
  })
  
  return context
}

