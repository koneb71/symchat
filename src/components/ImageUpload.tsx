import { useRef, useCallback } from 'react'
import * as React from 'react'
import { Button } from './ui/button'
import { X, FileText, Loader2, Upload } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Tesseract from 'tesseract.js'

interface UploadedImage {
  id: string
  file: File
  preview: string
  extractedText?: string
  isProcessing: boolean
}

interface ImageUploadProps {
  images: UploadedImage[]
  onImagesChange: (images: UploadedImage[]) => void
  disabled?: boolean
  skipOCR?: boolean // Skip OCR processing for vision models
}

export function ImageUpload({ images, onImagesChange, disabled, skipOCR }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef<UploadedImage[]>(images)

  // Keep ref in sync with images prop
  React.useEffect(() => {
    imagesRef.current = images
  }, [images])


  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newImages: UploadedImage[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image file`,
          variant: 'destructive',
        })
        continue
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit`,
          variant: 'destructive',
        })
        continue
      }

      const preview = URL.createObjectURL(file)
      const imageData: UploadedImage = {
        id: `${Date.now()}-${i}`,
        file,
        preview,
        isProcessing: skipOCR ? false : true, // Don't process if OCR is skipped
      }

      newImages.push(imageData)
    }

    const updatedImages = [...images, ...newImages]
    onImagesChange(updatedImages)

    // Process OCR for each new image (only if not skipped)
    if (!skipOCR) {
      newImages.forEach((imageData) => {
        performOCR(imageData)
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const performOCR = useCallback(async (imageData: UploadedImage) => {
    try {
      const result = await Tesseract.recognize(imageData.file, 'eng', {
        logger: (m) => {
          // You can log progress here if needed
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        },
      })

      const extractedText = result.data.text.trim()

      // Update the image with extracted text
      // Use imagesRef.current to get the latest images array
      onImagesChange(
        imagesRef.current.map((img: UploadedImage) =>
          img.id === imageData.id
            ? { ...img, extractedText, isProcessing: false }
            : img
        )
      )

      if (extractedText) {
        toast({
          title: 'OCR Complete',
          description: `Extracted ${extractedText.split(/\s+/).length} words from image`,
        })
      } else {
        toast({
          title: 'No text found',
          description: 'No readable text detected in the image',
        })
      }
    } catch (error) {
      console.error('OCR error:', error)
      // Update with error state using latest images from ref
      onImagesChange(
        imagesRef.current.map((img: UploadedImage) =>
          img.id === imageData.id
            ? { ...img, isProcessing: false, extractedText: '[OCR failed]' }
            : img
        )
      )
      toast({
        title: 'OCR Failed',
        description: 'Failed to extract text from image',
        variant: 'destructive',
      })
    }
  }, [onImagesChange])

  const removeImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview)
    }
    const updated = images.filter((img) => img.id !== id)
    onImagesChange(updated)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleUploadClick}
        disabled={disabled}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload Image for OCR
      </Button>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group border rounded-lg overflow-hidden bg-muted/50 w-32 h-32"
            >
              <img
                src={image.preview}
                alt="Uploaded"
                className="w-full h-full object-cover"
              />
              
              {/* Processing Overlay */}
              {image.isProcessing && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-purple-500/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                  <div className="text-center text-white">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                    <span className="text-xs font-medium animate-pulse">Processing OCR...</span>
                  </div>
                </div>
              )}

              {/* Text Indicator (only show for OCR mode) */}
              {!skipOCR && !image.isProcessing && image.extractedText && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="flex items-center gap-1 text-white text-xs">
                    <FileText className="h-3 w-3" />
                    <span>{image.extractedText.split(/\s+/).length} words</span>
                  </div>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Extracted Text Preview (only show for OCR mode) */}
      {!skipOCR && images.some((img) => img.extractedText) && (
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg border">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <FileText className="h-3 w-3" />
            Extracted Text (will be sent as context):
          </div>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {images.map((img) =>
              img.extractedText && !img.isProcessing ? (
                <div key={img.id} className="text-xs">
                  <span className="font-medium">• </span>
                  {img.extractedText.slice(0, 100)}
                  {img.extractedText.length > 100 ? '...' : ''}
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export type { UploadedImage }

