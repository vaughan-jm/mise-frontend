/**
 * SharedRecipePage
 *
 * Displays a shared recipe from a link.
 * Shows a preview with CTA to sign up and try pare.
 * Handles referral attribution via URL parameter.
 */

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import posthog from 'posthog-js'
import { PageLayout } from '../components'
import { getSharedRecipe, SharedRecipeResponse } from '../lib/api'

type SharedRecipe = SharedRecipeResponse['recipe']

export default function SharedRecipePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')

  const [recipe, setRecipe] = useState<SharedRecipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Store referral code in localStorage for attribution
  useEffect(() => {
    if (ref) {
      localStorage.setItem('pare_referral_code', ref)
      posthog.capture('referral_link_clicked', { ref_code: ref })
    }
  }, [ref])

  // Fetch the shared recipe
  useEffect(() => {
    async function fetchRecipe() {
      if (!id) {
        setError('Recipe not found')
        setLoading(false)
        return
      }

      try {
        const data = await getSharedRecipe(id, ref ?? undefined)
        setRecipe(data)
        posthog.capture('shared_recipe_viewed', {
          recipe_id: id,
          recipe_title: data.title,
          has_referral: !!ref,
        })
      } catch (err) {
        console.error('Failed to load recipe:', err)
        setError('Recipe not found or no longer available')
      } finally {
        setLoading(false)
      }
    }

    fetchRecipe()
  }, [id, ref])

  if (loading) {
    return (
      <PageLayout maxWidth="lg">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-ash">loading recipe...</div>
        </div>
      </PageLayout>
    )
  }

  if (error || !recipe) {
    return (
      <PageLayout maxWidth="lg">
        <div className="text-center py-16">
          <h1 className="text-2xl text-bone mb-4">recipe not found</h1>
          <p className="text-ash mb-8">{error}</p>
          <Link
            to="/"
            className="px-6 py-3 bg-sage text-obsidian rounded-full font-medium hover:bg-sage/90 transition-colors lowercase"
          >
            try pare for free
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout maxWidth="lg" className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="py-8"
      >
        {/* Recipe Header */}
        <div className="text-center mb-8">
          {recipe.imageUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden max-w-md mx-auto">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          <h1 className="text-3xl font-bold text-bone mb-4 lowercase">
            {recipe.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-ash mb-6">
            {recipe.prepTime && (
              <span>prep: {recipe.prepTime}</span>
            )}
            {recipe.cookTime && (
              <span>cook: {recipe.cookTime}</span>
            )}
            {recipe.servings && (
              <span>serves: {recipe.servings}</span>
            )}
            {recipe.difficulty && (
              <span className="capitalize">{recipe.difficulty}</span>
            )}
          </div>

          {/* Tags */}
          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {recipe.dietaryTags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gunmetal text-ash text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recipe Preview (limited) */}
        <div className="bg-gunmetal rounded-2xl p-6 mb-8">
          {/* Ingredients Preview */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-sage mb-3 uppercase tracking-wider">
              ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.slice(0, 5).map((ing: string, i: number) => (
                <li key={i} className="text-bone text-sm flex items-start gap-2">
                  <span className="text-sage">•</span>
                  {ing}
                </li>
              ))}
              {recipe.ingredients.length > 5 && (
                <li className="text-ash text-sm italic">
                  + {recipe.ingredients.length - 5} more ingredients...
                </li>
              )}
            </ul>
          </div>

          {/* Steps Preview */}
          <div>
            <h2 className="text-sm font-bold text-sage mb-3 uppercase tracking-wider">
              steps
            </h2>
            <ol className="space-y-3">
              {recipe.steps.slice(0, 3).map((step, i: number) => {
                const text = typeof step === 'string' ? step : step.instruction
                return (
                  <li key={i} className="text-bone text-sm flex gap-3">
                    <span className="text-sage font-medium">{i + 1}.</span>
                    <span>{text}</span>
                  </li>
                )
              })}
              {recipe.steps.length > 3 && (
                <li className="text-ash text-sm italic pl-6">
                  + {recipe.steps.length - 3} more steps...
                </li>
              )}
            </ol>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-ash">
            want the full recipe without ads?
          </p>
          <Link
            to="/"
            onClick={() => {
              posthog.capture('shared_recipe_cta_clicked', {
                recipe_id: id,
                has_referral: !!ref,
              })
            }}
            className="inline-block px-8 py-3 bg-sage text-obsidian rounded-full font-medium hover:bg-sage/90 transition-colors lowercase"
          >
            try pare for free
          </Link>
          <p className="text-xs text-ash/60">
            clean recipes, no life stories
          </p>
        </div>

        {/* Attribution */}
        {recipe.source && (
          <div className="mt-8 pt-6 border-t border-ash/10 text-center">
            <p className="text-xs text-ash/60">
              recipe from {recipe.sourceUrl ? (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sage hover:underline"
                >
                  {recipe.source}
                </a>
              ) : (
                recipe.source
              )}
            </p>
          </div>
        )}
      </motion.div>
    </PageLayout>
  )
}
