
'use client'

import { useMemo, useState } from 'react'
import { Plus, Users, GraduationCap, School } from 'lucide-react'
import { useSchool } from '@/lib/store'

const CLASS_ORDER = [
  'Playgroup',
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
]

function normalizeClassName(value: string) {
  const name = String(value || '').trim().toLowerCase()

  if (name === 'play group' || name === 'playgroup') {
    return 'playgroup'
  }

  if (name === 'preprimary 1' || name === 'pp1') {
    return 'pp1'
  }

  if (name === 'preprimary 2' || name === 'pp2') {
    return 'pp2'
  }

  return name
}

function displayClassName(value: string) {
  const name = String(value || '').trim()

  if (name.toLowerCase() === 'play group') {
    return 'Playgroup'
  }

  if (name.toLowerCase() === 'playgroup') {
    return 'Playgroup'
  }

  if (name.toLowerCase() === 'preprimary 1') {
    return 'PP1'
  }

  if (name.toLowerCase() === 'preprimary 2') {
    return 'PP2'
  }

  return name
}

export default function ClassesPage() {
  const { data, addClass, role } = useSchool()

  const [showForm, setShowForm] = useState(false)
  const [className, setClassName] = useState('')
  const [stream, setStream] = useState('')

  const stats = useMemo(() => {
    return data.classes
      .map((c) => {
        const displayName = displayClassName(c.name)

        const count = data.students.filter((s) => {
          const studentClass = normalizeClassName(
            String(s.className || s.classId || '')
          )

          const currentClass = normalizeClassName(displayName)

          return studentClass === currentClass
        }).length

        return {
          ...c,
          displayName,
          studentCount: count,
        }
      })
      .sort((a, b) => {
        const aIndex = CLASS_ORDER.findIndex(
          (name) =>
            normalizeClassName(name) ===
            normalizeClassName(a.displayName)
        )

        const bIndex = CLASS_ORDER.findIndex(
          (name) =>
            normalizeClassName(name) ===
            normalizeClassName(b.displayName)
        )

        return (
          (aIndex === -1 ? 999 : aIndex) -
          (bIndex === -1 ? 999 : bIndex)
        )
      })
  }, [data.classes, data.students])

  const preschool = stats.filter((c) =>
    ['Playgroup', 'PP1', 'PP2'].includes(c.displayName)
  )

  const lowerPrimary = stats.filter((c) =>
    ['Grade 1', 'Grade 2', 'Grade 3'].includes(c.displayName)
  )

  const upperPrimary = stats.filter((c) =>
    ['Grade 4', 'Grade 5', 'Grade 6'].includes(c.displayName)
  )

  const juniorSchool = stats.filter((c) =>
    ['Grade 7', 'Grade 8', 'Grade 9'].includes(c.displayName)
  )

  const totalStudents = data.students.length

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault()

    if (!className.trim()) {
      return
    }

    await addClass({
      name: className.trim(),
      streams: stream.trim() ? [stream.trim()] : [],
      classTeacherId: null,
    })

    setClassName('')
    setStream('')
    setShowForm(false)
  }

  function ClassCard({
    classData,
  }: {
    classData: (typeof stats)[number]
  }) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              {classData.displayName}
            </h3>

            {classData.streams && classData.streams.length > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Streams: {classData.streams.join(', ')}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Main class
              </p>
            )}
          </div>

          <div className="rounded-lg bg-primary/10 p-2">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />

          <span>
            {classData.studentCount}{' '}
            {classData.studentCount === 1 ? 'student' : 'students'}
          </span>
        </div>
      </div>
    )
  }

  function ClassSection({
    title,
    classes,
  }: {
    title: string
    classes: typeof stats
  }) {
    if (classes.length === 0) {
      return null
    }

    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <School className="h-5 w-5 text-primary" />

          <h2 className="text-xl font-semibold">
            {title}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classData) => (
            <ClassCard
              key={classData.id}
              classData={classData}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Classes & Streams
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage school classes, streams and student enrolment.
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />

            New Class
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Total Classes
          </p>

          <p className="mt-2 text-3xl font-bold">
            {stats.length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Total Students
          </p>

          <p className="mt-2 text-3xl font-bold">
            {totalStudents}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Streams
          </p>

          <p className="mt-2 text-3xl font-bold">
            {stats.reduce(
              (total, c) => total + (c.streams?.length || 0),
              0
            )}
          </p>
        </div>
      </div>

      {showForm && role === 'admin' && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Add New Class
          </h2>

          <form
            onSubmit={handleAddClass}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div>
              <label
                htmlFor="className"
                className="mb-2 block text-sm font-medium"
              >
                Class name
              </label>

              <input
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Grade 1"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="stream"
                className="mb-2 block text-sm font-medium"
              >
                Stream
              </label>

              <input
                id="stream"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                placeholder="e.g. A"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Add Class
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-10">
        <ClassSection
          title="Preschool"
          classes={preschool}
        />

        <ClassSection
          title="Lower Primary"
          classes={lowerPrimary}
        />

        <ClassSection
          title="Upper Primary"
          classes={upperPrimary}
        />

        <ClassSection
          title="Junior School"
          classes={juniorSchool}
        />
      </div>
    </div>
  )
}
