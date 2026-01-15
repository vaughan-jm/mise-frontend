/**
 * HomePage
 *
 * Landing page with recipe input (URL/Photo/YouTube).
 * Ultra-minimal design with input centered.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useRecipe, useQuota } from '../hooks'
import { PageLayout, Button, Input, TabSwitcher } from '../components'
import type { Tab } from '../components/ui/TabSwitcher'
import type { ExtractionMode } from '../hooks/useRecipe'
import { loadingMessages } from '../config/content'

// Icons for tabs
const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

const CameraIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const VideoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const inputTabs: Tab<ExtractionMode>[] = [
  { id: 'url', label: 'url', icon: <LinkIcon /> },
  { id: 'photo', label: 'photo', icon: <CameraIcon /> },
  { id: 'youtube', label: 'video', icon: <VideoIcon /> },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { t, translate, language } = useApp()
  const { extract, isLoading, error, clearError } = useRecipe()
  const { remaining, canExtract, isUnlimited } = useQuota()

  // Input state
  const [mode, setMode] = useState<ExtractionMode>('url')
  const [urlInput, setUrlInput] = useState('')
  const [youtubeInput, setYoutubeInput] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Loading message rotation
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [isLoading])

  // Handle photo upload
  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: string[] = []
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newPhotos.push(reader.result)
          if (newPhotos.length === files.length) {
            setPhotos((prev) => [...prev, ...newPhotos])
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // Remove photo
  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Handle extract
  const handleExtract = useCallback(async () => {
    if (!canExtract) return

    clearError()
    let recipe = null

    switch (mode) {
      case 'url':
        if (!urlInput.trim()) return
        recipe = await extract('url', { url: urlInput.trim(), language })
        break
      case 'photo':
        if (photos.length === 0) return
        recipe = await extract('photo', { photos, language })
        break
      case 'youtube':
        if (!youtubeInput.trim()) return
        recipe = await extract('youtube', { url: youtubeInput.trim(), language })
        break
    }

    if (recipe) {
      navigate('/recipe', { state: { recipe, sourceUrl: mode === 'url' ? urlInput : mode === 'youtube' ? youtubeInput : null } })
    }
  }, [mode, urlInput, youtubeInput, photos, language, canExtract, extract, clearError, navigate])

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleExtract()
    }
  }, [handleExtract, isLoading])

  // Check if can submit
  const canSubmit = canExtract && !isLoading && (
    (mode === 'url' && urlInput.trim()) ||
    (mode === 'photo' && photos.length > 0) ||
    (mode === 'youtube' && youtubeInput.trim())
  )

  return (
    <PageLayout centered maxWidth="md" className="px-4">
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* Logo & Tagline */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-bone lowercase">{t.appName}</h1>
          <p className="text-xl text-ash">{t.tagline}</p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          {/* Mode Tabs */}
          <div className="flex justify-center">
            <TabSwitcher
              tabs={inputTabs}
              activeTab={mode}
              onChange={setMode}
              size="sm"
            />
          </div>

          {/* URL Input */}
          <AnimatePresence mode="wait">
            {mode === 'url' && (
              <motion.div
                key="url"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Input
                  type="url"
                  placeholder={t.urlPlaceholder}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  inputSize="lg"
                  disabled={isLoading}
                />
              </motion.div>
            )}

            {/* Photo Input */}
            {mode === 'photo' && (
              <motion.div
                key="photo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {/* Photo previews */}
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Upload ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-rust text-bone rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full py-8 border-2 border-dashed border-ash/30 rounded-lg text-ash hover:border-sage hover:text-bone transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <CameraIcon />
                    <span className="text-sm">{t.dragDropPhotos}</span>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </motion.div>
            )}

            {/* YouTube Input */}
            {mode === 'youtube' && (
              <motion.div
                key="youtube"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Input
                  type="url"
                  placeholder={t.youtubePlaceholder}
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  inputSize="lg"
                  disabled={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Extract Button */}
          <Button
            onClick={handleExtract}
            disabled={!canSubmit}
            isLoading={isLoading}
            fullWidth
            size="lg"
          >
            {isLoading ? loadingMessages[loadingMessageIndex] : t.extractButton}
          </Button>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-rust text-sm"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Quota & Subtitle */}
        <div className="text-center space-y-2">
          <p className="text-sm text-ash">
            {isUnlimited
              ? t.unlimited
              : translate('recipesRemaining', { count: remaining })}
          </p>
          <p className="text-xs text-ash/60">{t.worksWithAnySite}</p>
        </div>
      </div>
    </PageLayout>
  )
}
