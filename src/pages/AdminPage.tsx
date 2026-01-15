/**
 * AdminPage
 *
 * Admin dashboard with stats and user management.
 * Requires admin privileges.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PageLayout, Card, Spinner, Button } from '../components'
import { getAdminStats, getAdminUsers, type AdminStats, type AdminUser } from '../lib/api'

// Stat card component
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card padding="md">
      <p className="text-sm text-ash lowercase">{label}</p>
      <p className="text-2xl font-bold text-bone">{value}</p>
    </Card>
  )
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading, isApiReady } = useApp()

  // State
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const pageSize = 20

  // Check admin access
  useEffect(() => {
    if (!isAuthLoading && !user?.isAdmin) {
      navigate('/')
    }
  }, [isAuthLoading, user, navigate])

  // Fetch stats
  useEffect(() => {
    if (!isApiReady || !user?.isAdmin) return

    const fetchStats = async () => {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch (err) {
        setError('Failed to load stats')
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [isApiReady, user])

  // Fetch users
  const fetchUsers = useCallback(async (pageNum: number) => {
    if (!isApiReady || !user?.isAdmin) return

    setIsLoadingUsers(true)
    try {
      const data = await getAdminUsers(pageNum, pageSize)
      setUsers(data.users)
      setTotalUsers(data.total)
      setPage(data.page)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [isApiReady, user])

  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = ['Email', 'Subscription', 'Recipes Used', 'Created At']
    const rows = users.map((u) => [
      u.email,
      u.subscription,
      String(u.recipesUsedThisMonth),
      u.createdAt,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pare-users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [users])

  // Don't render until we verify admin status
  if (isAuthLoading || !user?.isAdmin) {
    return (
      <PageLayout centered>
        <Spinner size="lg" />
      </PageLayout>
    )
  }

  return (
    <PageLayout maxWidth="2xl" className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bone lowercase">admin dashboard</h1>
        <Button variant="secondary" size="sm" onClick={handleExportCSV}>
          export csv
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-rust/20 border border-rust rounded-lg text-rust">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {isLoadingStats ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="total users" value={stats.totalUsers} />
          <StatCard label="total recipes" value={stats.totalRecipes} />
          <StatCard label="active subscriptions" value={stats.activeSubscriptions} />
          <StatCard label="revenue this month" value={formatCurrency(stats.revenueThisMonth)} />
        </div>
      )}

      {/* Users Table */}
      <Card padding="none">
        <div className="p-4 border-b border-obsidian">
          <h2 className="font-bold text-bone lowercase">users ({totalUsers})</h2>
        </div>

        {isLoadingUsers ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-obsidian">
                    <th className="text-left p-3 text-sm text-ash font-medium">email</th>
                    <th className="text-left p-3 text-sm text-ash font-medium">subscription</th>
                    <th className="text-left p-3 text-sm text-ash font-medium">recipes used</th>
                    <th className="text-left p-3 text-sm text-ash font-medium">joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-obsidian/50 hover:bg-obsidian/30">
                      <td className="p-3 text-sm text-bone">{user.email}</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          user.subscription === 'pro'
                            ? 'bg-sage/20 text-sage'
                            : user.subscription === 'basic'
                            ? 'bg-ash/20 text-ash'
                            : 'bg-obsidian text-ash'
                        }`}>
                          {user.subscription}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-bone">{user.recipesUsedThisMonth}</td>
                      <td className="p-3 text-sm text-ash">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalUsers > pageSize && (
              <div className="flex justify-center gap-2 p-4 border-t border-obsidian">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchUsers(page - 1)}
                >
                  previous
                </Button>
                <span className="px-3 py-1.5 text-sm text-ash">
                  page {page} of {Math.ceil(totalUsers / pageSize)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= Math.ceil(totalUsers / pageSize)}
                  onClick={() => fetchUsers(page + 1)}
                >
                  next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </PageLayout>
  )
}
