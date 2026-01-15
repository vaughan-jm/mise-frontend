/**
 * ContactPage
 *
 * Contact form page.
 */

import { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { PageLayout, Card, Button, Input } from '../components'
import { useToast } from '../components/ui/Toast'
import { submitContact } from '../lib/api'

export default function ContactPage() {
  const { t, user } = useApp()
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const canSubmit = name.trim() && email.trim() && message.trim() && !isSubmitting

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      await submitContact(name.trim(), email.trim(), message.trim())
      setIsSubmitted(true)
      showToast(t.messageSent, 'success')
    } catch (error) {
      showToast('Failed to send message. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, name, email, message, showToast, t])

  return (
    <PageLayout maxWidth="md" className="px-4 py-8">
      <Card padding="lg">
        <h1 className="text-2xl font-bold text-bone lowercase mb-6">{t.contact}</h1>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-sage/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-bone lowercase">{t.messageSent}</h2>
            <p className="text-ash">we'll get back to you as soon as possible.</p>
            <Button variant="secondary" onClick={() => setIsSubmitted(false)}>
              send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.yourName}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name"
              disabled={isSubmitting}
            />

            <Input
              label={t.yourEmail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isSubmitting}
            />

            <div>
              <label className="block text-sm font-medium text-ash mb-1.5 lowercase">
                {t.yourMessage}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="how can we help?"
                rows={5}
                disabled={isSubmitting}
                className="
                  block w-full rounded-lg
                  bg-gunmetal text-bone
                  border border-transparent
                  placeholder:text-ash/60
                  focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage
                  disabled:bg-gunmetal/50 disabled:text-ash disabled:cursor-not-allowed
                  transition-colors duration-150
                  px-4 py-2.5 text-base
                  resize-none
                "
              />
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={!canSubmit}
              isLoading={isSubmitting}
            >
              {t.send}
            </Button>
          </form>
        )}
      </Card>

      {/* Direct email option */}
      <p className="text-center text-sm text-ash mt-6">
        or email us directly at{' '}
        <a href="mailto:hello@pare.cooking" className="text-sage hover:underline">
          hello@pare.cooking
        </a>
      </p>
    </PageLayout>
  )
}
