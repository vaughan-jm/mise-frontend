/**
 * RefundPage
 *
 * Refund policy page.
 */

import { PageLayout, Card } from '../components'
import { legal } from '../config/content'

export default function RefundPage() {
  const { title, lastUpdated, content } = legal.refund

  return (
    <PageLayout maxWidth="lg" className="px-4 py-8">
      <Card padding="lg">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-2xl font-bold text-bone lowercase mb-2">{title}</h1>
          <p className="text-sm text-ash mb-6">Last updated: {lastUpdated}</p>

          <div className="space-y-4 text-ash">
            {content.split('\n\n').map((paragraph, index) => {
              // Handle markdown headers
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-lg font-bold text-bone lowercase mt-6 mb-2">
                    {paragraph.replace('## ', '')}
                  </h2>
                )
              }

              // Handle list items
              if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n').filter(Boolean)
                return (
                  <ul key={index} className="list-disc list-inside space-y-1">
                    {items.map((item, i) => (
                      <li key={i}>{item.replace('- ', '')}</li>
                    ))}
                  </ul>
                )
              }

              // Regular paragraph
              return (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              )
            })}
          </div>
        </div>
      </Card>
    </PageLayout>
  )
}
