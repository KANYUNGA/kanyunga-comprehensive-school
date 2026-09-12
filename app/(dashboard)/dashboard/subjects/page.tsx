 id="481mqp"
'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  Search,
  GraduationCap,
  Layers,
} from 'lucide-react'

import { useSchool } from '@/lib/store'
import type { Subject } from '@/lib/data'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = [
  'Pre-primary',
  'Lower Primary',
  'Upper Primary',
  'Junior School',
] as const

type Category = (typeof CATEGORIES)[number]

function normalizeCategory(value: unknown): Category | null {
  const category = String(value ?? '')
    .trim()
    .toLowerCase()

  if (
    category === 'pre-primary' ||
    category === 'preprimary' ||
    category === 'pre primary'
  ) {
    return 'Pre-primary'
  }

  if (
    category === 'lower primary' ||
    category === 'lower-primary'
  ) {
    return 'Lower Primary'
  }

  if (
    category === 'upper primary' ||
    category === 'upper-primary'
  ) {
    return 'Upper Primary'
  }

  if (
    category === 'junior school' ||
    category === 'junior-school' ||
    category === 'junior secondary' ||
    category === 'jss'
  ) {
    return 'Junior School'
  }

  return null
}

function sortSubjects(subjects: Subject[]) {
  return [...subjects].sort((a, b) =>
    String(a.name ?? '').localeCompare(
      String(b.name ?? ''),
    ),
  )
}

export default function SubjectsPage() {
  const { data } = useSchool()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<Category | 'All'>('All')

  const subjects = useMemo(() => {
    const term = search.trim().toLowerCase()

    return sortSubjects(
      data.subjects.filter((subject) => {
        const category = normalizeCategory(
          subject.category,
        )

        const matchesCategory =
          selectedCategory === 'All' ||
          category === selectedCategory

        if (!matchesCategory) {
          return false
        }

        if (!term) {
          return true
        }

        return (
          String(subject.name ?? '')
            .toLowerCase()
            .includes(term) ||
          String(subject.code ?? '')
            .toLowerCase()
            .includes(term) ||
          String(subject.category ?? '')
            .toLowerCase()
            .includes(term)
        )
      }),
    )
  }, [
    data.subjects,
    search,
    selectedCategory,
  ])

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      'Pre-primary': 0,
      'Lower Primary': 0,
      'Upper Primary': 0,
      'Junior School': 0,
    }

    for (const subject of data.subjects) {
      const category = normalizeCategory(
        subject.category,
      )

      if (category) {
        counts[category] += 1
      }
    }

    return counts
  }, [data.subjects])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="View and manage the learning areas and subjects offered at Kanyunga Comprehensive School."
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category) => (
          <Card
            key={category}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() =>
              setSelectedCategory(category)
            }
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {category}
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {categoryCounts[category]}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {categoryCounts[category] === 1
                      ? 'subject'
                      : 'subjects'}
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">
                Search Subjects
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search by subject name or code..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedCategory('All')
                }
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                All
              </button>

              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects list */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  School Subjects
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {subjects.length}{' '}
                  {subjects.length === 1
                    ? 'subject'
                    : 'subjects'}{' '}
                  displayed
                </p>
              </div>

              <Badge variant="secondary">
                {selectedCategory === 'All'
                  ? 'All Levels'
                  : selectedCategory}
              </Badge>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />

              <h3 className="font-semibold">
                No subjects found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? 'Try changing your search.'
                  : 'No subjects have been registered yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {subjects.map((subject) => {
                const category =
                  normalizeCategory(
                    subject.category,
                  )

                return (
                  <div
                    key={subject.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>

                      <div>
                        <h3 className="font-semibold">
                          {subject.name}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {subject.code && (
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {subject.code}
                            </Badge>
                          )}

                          {category && (
                            <Badge
                              variant="secondary"
                            >
                              {category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />

                      <span>
                        {category || 'School subject'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning levels */}
      <div className="grid gap-4 md:grid-cols-2">
        {CATEGORIES.map((category) => {
          const categorySubjects =
            sortSubjects(
              data.subjects.filter(
                (subject) =>
                  normalizeCategory(
                    subject.category,
                  ) === category,
              ),
            )

          return (
            <Card key={category}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {category}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {categorySubjects.length}{' '}
                      {categorySubjects.length === 1
                        ? 'subject'
                        : 'subjects'}
                    </p>
                  </div>
                </div>

                {categorySubjects.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {categorySubjects.map(
                      (subject) => (
                        <Badge
                          key={subject.id}
                          variant="outline"
                        >
                          {subject.name}
                        </Badge>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

