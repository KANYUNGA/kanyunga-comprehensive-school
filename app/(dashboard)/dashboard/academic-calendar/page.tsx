'use client'

import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'

interface AcademicTerm {
  id: number
  academic_year: number
  term: string
  start_date: string
  end_date: string
  status: 'Upcoming' | 'Current' | 'Closed'
}

export default function AcademicCalendarPage() {
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadTerms() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/academic-terms')

      if (!response.ok) {
        throw new Error('Failed to load academic calendar')
      }

      const result = await response.json()
      setTerms(Array.isArray(result.terms) ? result.terms : [])
    } catch (err) {
      console.error(err)
      setError('Failed to load school calendar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTerms()
  }, [])

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            School Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the continuous academic year and school terms.
          </p>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Loading school calendar...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold">Academic Terms</h2>
            <p className="text-sm text-muted-foreground">
              Your school year continues from one term to the next while
              keeping previous academic records.
            </p>
          </div>

          {terms.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No academic terms have been created yet.
            </div>
          ) : (
            <div className="divide-y">
              {terms.map((term) => (
                <div
                  key={term.id}
                  className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        {term.academic_year} — {term.term}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          term.status === 'Current'
                            ? 'bg-green-100 text-green-700'
                            : term.status === 'Closed'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {term.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(term.start_date)} —{' '}
                      {formatDate(term.end_date)}
                    </p>
                  </div>

                  <div className="text-sm font-medium">
                    {term.status === 'Current'
                      ? 'Current term'
                      : term.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
