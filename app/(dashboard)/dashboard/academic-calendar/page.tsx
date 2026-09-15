'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'

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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [academicYear, setAcademicYear] = useState('2027')
  const [term, setTerm] = useState('Term 1')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<'Upcoming' | 'Current' | 'Closed'>(
    'Upcoming'
  )

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

  async function addTerm(event: React.FormEvent) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!academicYear || !startDate || !endDate) {
        setError('Please fill in all required fields.')
        setSaving(false)
        return
      }

      if (new Date(endDate) < new Date(startDate)) {
        setError('End date cannot be before start date.')
        setSaving(false)
        return
      }

      const response = await fetch('/api/academic-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academicYear: Number(academicYear),
          term,
          startDate,
          endDate,
          status,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add academic term')
      }

      setMessage('Academic term added successfully.')

      setShowForm(false)
      setStartDate('')
      setEndDate('')

      await loadTerms()
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add academic term'
      )
    } finally {
      setSaving(false)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm)
            setError('')
            setMessage('')
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Academic Term
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">
            Add Academic Term
          </h2>

          <p className="mb-5 text-sm text-muted-foreground">
            Add a new term without removing previous academic records.
          </p>

          <form onSubmit={addTerm} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Academic Year
              </label>

              <input
                type="number"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                min="2020"
                max="2100"
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Term
              </label>

              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as
                      | 'Upcoming'
                      | 'Current'
                      | 'Closed'
                  )
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Current">Current</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Academic Term'}
              </button>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Loading school calendar...
        </div>
      ) : (
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
              {terms.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold">
                        {item.academic_year} — {item.term}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === 'Current'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'Closed'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(item.start_date)} —{' '}
                      {formatDate(item.end_date)}
                    </p>
                  </div>

                  <div className="text-sm font-medium">
                    {item.status === 'Current'
                      ? 'Current term'
                      : item.status}
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
