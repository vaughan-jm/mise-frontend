/**
 * HomePage
 *
 * Ultra-minimal landing page with smart input.
 * "pare" heading + "just the recipe." tagline + smart input field.
 */

import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useRecipe, useQuota } from '../hooks'
import { PageLayout, SmartInput } from '../components'
import type { InputType } from '../components/ui/SmartInput'
import { loadingMessages } from '../config/content'

export default function HomePage() {
  const navigate = useNavigate()
  const { language } = useApp()
  const { extract, isLoading, error, clearError } = useRecipe()
  const { canExtract } = useQuota()

  // Loading message rotation
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [isLoading])

  // Handle extraction from SmartInput
  const handleSubmit = useCallback(
    async (type: InputType, data: { url?: string; photos?: string[] }) => {
      if (!canExtract) return

      clearError()
      let recipe = null

      switch (type) {
        case 'url':
          if (!data.url) return
          recipe = await extract('url', { url: data.url, language })
          break
        case 'youtube':
          if (!data.url) return
          recipe = await extract('youtube', { url: data.url, language })
          break
        case 'photo':
          if (!data.photos || data.photos.length === 0) return
          recipe = await extract('photo', { photos: data.photos, language })
          break
      }

      if (recipe) {
        navigate('/recipe', {
          state: {
            recipe,
            sourceUrl: type === 'url' || type === 'youtube' ? data.url : null,
          },
        })
      }
    },
    [language, canExtract, extract, clearError, navigate]
  )

  return (
    <PageLayout centered maxWidth="md" className="px-4">
      <div className="w-full flex flex-col items-center">
        {/* Branding */}
        <h1 className="text-5xl md:text-[48px] font-bold text-bone lowercase">
          pare
        </h1>
        <p className="text-base text-ash mt-2 lowercase">
          just the recipe.
        </p>

        {/* Smart Input */}
        <div className="w-full max-w-[400px] mt-8">
          <SmartInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            disabled={!canExtract}
            placeholder="recipe or YouTube URL"
          />

          {/* Loading message */}
          {isLoading && (
            <motion.p
              key={loadingMessageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-ash text-sm mt-4"
            >
              {loadingMessages[loadingMessageIndex]}
            </motion.p>
          )}

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-rust text-sm mt-4"
            >
              {error}
            </motion.p>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
