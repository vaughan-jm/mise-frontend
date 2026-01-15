/**
 * CookbookPage
 *
 * Grid of saved recipes.
 * Requires authentication.
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useSavedRecipes } from '../hooks'
import { PageLayout, Button, Card, Spinner } from '../components'
import { useToast } from '../components/ui/Toast'
import type { SavedRecipe } from '../lib/types'

// Recipe card component
function RecipeCard({
  recipe,
  onOpen,
  onDelete,
}: {
  recipe: SavedRecipe
  onOpen: () => void
  onDelete: () => void
}) {
  const { t } = useApp()

  return (
    <Card variant="interactive" className="group" onClick={onOpen}>
      <div className="space-y-2">
        {/* Image */}
        {recipe.imageUrl && (
          <div className="aspect-video rounded overflow-hidden bg-obsidian -mx-4 -mt-4 mb-3">
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-bone lowercase line-clamp-2">
          {recipe.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-ash">
          <span>{recipe.ingredients.length} {t.ingredients}</span>
          <span>·</span>
          <span>{recipe.steps.length} {t.steps}</span>
        </div>

        {/* Source */}
        {recipe.source && (
          <p className="text-xs text-ash/60 truncate">{recipe.source}</p>
        )}

        {/* Delete button (shown on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 p-1.5 rounded bg-rust/80 text-bone opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete recipe"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </Card>
  )
}

// Empty state
function EmptyState() {
  const { t } = useApp()
  const navigate = useNavigate()

  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-gunmetal flex items-center justify-center">
        <svg className="w-8 h-8 text-ash" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-bone lowercase">no saved recipes yet</h2>
      <p className="text-ash">start by extracting a recipe to save it here</p>
      <Button onClick={() => navigate('/')}>
        {t.extractButton} a recipe
      </Button>
    </div>
  )
}

// Sign in prompt
function SignInPrompt() {
  const { t } = useApp()

  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-gunmetal flex items-center justify-center">
        <svg className="w-8 h-8 text-ash" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-bone lowercase">sign in to view your cookbook</h2>
      <p className="text-ash">save recipes and access them from any device</p>
      <SignInButton mode="modal">
        <Button>{t.signIn}</Button>
      </SignInButton>
    </div>
  )
}

export default function CookbookPage() {
  const { t } = useApp()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { recipes, isLoading, remove } = useSavedRecipes()

  // Open a recipe
  const handleOpen = useCallback((recipe: SavedRecipe) => {
    // Convert SavedRecipe to Recipe format
    navigate('/recipe', {
      state: {
        recipe: {
          title: recipe.title,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          tips: recipe.tips,
          source: recipe.source,
          sourceUrl: recipe.sourceUrl,
          imageUrl: recipe.imageUrl,
        },
        sourceUrl: recipe.sourceUrl,
      },
    })
  }, [navigate])

  // Delete a recipe
  const handleDelete = useCallback(async (recipe: SavedRecipe) => {
    const success = await remove(recipe.id)
    if (success) {
      showToast('Recipe deleted', 'info')
    }
  }, [remove, showToast])

  return (
    <PageLayout maxWidth="2xl" className="px-4 py-6">
      <SignedOut>
        <SignInPrompt />
      </SignedOut>

      <SignedIn>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-bone lowercase">{t.cookbook}</h1>
          <span className="text-sm text-ash">{recipes.length} recipes</span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && recipes.length === 0 && <EmptyState />}

        {/* Recipe grid */}
        {!isLoading && recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {recipes.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <RecipeCard
                    recipe={recipe}
                    onOpen={() => handleOpen(recipe)}
                    onDelete={() => handleDelete(recipe)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </SignedIn>
    </PageLayout>
  )
}
