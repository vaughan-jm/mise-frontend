/**
 * SmartInput Component
 *
 * Single input field that auto-detects input type:
 * - Regular URLs → URL extraction
 * - YouTube URLs → YouTube extraction
 * - Photos → Photo extraction
 *
 * Features:
 * - Camera icon (left) for photo upload
 * - Arrow button (right) for extraction
 * - Drag & drop photos
 * - Clipboard paste for images
 * - Multiple photo selection
 * - Mobile camera capture
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Icons
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ArrowIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

export type InputType = 'url' | 'youtube' | 'photo'

interface SmartInputProps {
  onSubmit: (type: InputType, data: { url?: string; photos?: string[] }) => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

// Check if URL is a YouTube link
function isYouTubeUrl(url: string): boolean {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\//,
    /(?:https?:\/\/)?youtu\.be\//,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\//,
  ]
  return patterns.some(pattern => pattern.test(url))
}

export default function SmartInput({
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = 'paste any recipe url',
}: SmartInputProps) {
  const [textInput, setTextInput] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  // Handle photo upload from file input
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const newPhotos: string[] = []
    let processed = 0

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newPhotos.push(reader.result)
          processed++
          if (processed === files.length || newPhotos.length === processed) {
            setPhotos((prev) => [...prev, ...newPhotos])
            setTextInput('') // Clear text when photos are added
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // Handle drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
      if (imageItems.length === 0) return

      e.preventDefault()
      const files = imageItems
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null)

      if (files.length > 0) {
        const dataTransfer = new DataTransfer()
        files.forEach(file => dataTransfer.items.add(file))
        handleFileSelect(dataTransfer.files)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFileSelect])

  // Remove a photo
  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (disabled || isLoading) return

    // If we have photos, submit as photo
    if (photos.length > 0) {
      onSubmit('photo', { photos })
      return
    }

    // Otherwise, check text input
    const url = textInput.trim()
    if (!url) return

    if (isYouTubeUrl(url)) {
      onSubmit('youtube', { url })
    } else {
      onSubmit('url', { url })
    }
  }, [photos, textInput, disabled, isLoading, onSubmit])

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit()
    }
  }, [handleSubmit, isLoading])

  // Can submit?
  const canSubmit = !disabled && !isLoading && (photos.length > 0 || textInput.trim().length > 0)

  // Mode indicator for placeholder
  const currentPlaceholder = photos.length > 0
    ? `${photos.length} photo${photos.length > 1 ? 's' : ''} selected`
    : placeholder

  return (
    <div className="w-full">
      {/* Main input container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex items-center
          h-[52px] rounded-full
          bg-gunmetal border
          transition-colors
          ${isDragging ? 'border-sage bg-sage/10' : 'border-ash/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Camera button (left) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
          className="flex-shrink-0 p-3 pl-4 text-ash hover:text-sage transition-colors disabled:cursor-not-allowed"
          aria-label="Upload photos"
        >
          <CameraIcon />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Text input */}
        <input
          ref={textInputRef}
          type="text"
          value={photos.length > 0 ? '' : textInput}
          onChange={(e) => {
            setTextInput(e.target.value)
            if (photos.length > 0) setPhotos([]) // Clear photos when typing
          }}
          onKeyDown={handleKeyDown}
          placeholder={currentPlaceholder}
          disabled={disabled || isLoading || photos.length > 0}
          className={`
            flex-1 h-full
            bg-transparent
            text-lg text-bone placeholder:text-ash
            outline-none
            ${photos.length > 0 ? 'cursor-default' : ''}
          `}
        />

        {/* Arrow button (right) */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`
            flex-shrink-0 p-3 pr-4
            transition-colors
            ${canSubmit
              ? 'text-sage hover:text-bone'
              : 'text-ash/40 cursor-not-allowed'}
          `}
          aria-label="Extract recipe"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-sage/30 border-t-sage rounded-full animate-spin" />
          ) : (
            <ArrowIcon />
          )}
        </button>
      </div>

      {/* Photo thumbnails */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 justify-center mt-3"
          >
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <img
                  src={photo}
                  alt={`Upload ${index + 1}`}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-rust text-bone rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  ×
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
