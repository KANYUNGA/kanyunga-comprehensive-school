'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, UserX } from 'lucide-react'

type AttendanceStatus = 'Present' | 'Absent' | 'Late'

type Student = {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  gender?: string
  classId: string
  stream?: string
  status?: string
}

type AttendanceRecord = {
  studentId: string
  status: AttendanceStatus
}

const STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Late']

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/students')

        if (!response.ok) {
          throw new Error('Failed to load students')
        }

        const result = await response.json()

        const loadedStudents: Student[] = Array.isArray(result)
          ? result
          : result.data ?? result.students ?? []

        setStudents(loadedStudents)

        const uniqueClasses = Array.from(
          new Set(
            loadedStudents
              .filter((s) => s.status !== 'Inactive')
              .map((s) => s.classId)
              .filter(Boolean)
          )
        )

        setClasses(uniqueClasses)

        if (uniqueClasses.length > 0) {
          setClassId(uniqueClasses[0])
        }
      } catch (err) {
        console.error(err)
        setError('Unable to load students from the database.')
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [])

  const roster = useMemo(
    () =>
      students.filter(
        (s) =>
          s.classId === classId &&
          s.status !== 'Inactive'
      ),
    [students, classId]
  )

  function statusFor(studentId: string): AttendanceStatus {
    return draft[studentId] ?? 'Present'
  }

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      Present: 0,
      Absent: 0,
      Late: 0,
    }

    roster.forEach((student) => {
      counts[statusFor(student.id)]++
    })

    return counts
  }, [roster, draft])

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {}

    roster.forEach((student) => {
      next[student.id] = status
    })

    setDraft(next)
  }

  async function save() {
    try {
      setSaving(true)
      setError('')

      const records: AttendanceRecord[] = roster.map((student) => ({
        studentId: student.id,
        status: statusFor(student.id),
      }))

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          records,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save attendance')
      }

      setDraft({})
      alert('Attendance saved successfully.')
    } catch (err) {
      console.error(err)
      setError('Unable to save attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Attendance"
        description="Mark and review daily student attendance per class."
      />

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="att-class">Class</Label>

            <Select
              value={classId}
              onValueChange={(value) => {
                setClassId(value)
                setDraft({})
              }}
            >
              <SelectTrigger id="att-class" className="w-48">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>

              <SelectContent>
                {classes.map((className) => (
                  <SelectItem
                    key={className}
                    value={className}
                  >
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="att-date">Date</Label>

            <Input
              id="att-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setDraft({})
              }}
              className="w-44"
            />
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll('Present')}
              disabled={roster.length === 0}
            >
              Mark all present
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll('Absent')}
              disabled={roster.length === 0}
            >
              Mark all absent
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile
          icon={CheckCircle2}
          label="Present"
          value={summary.Present}
          tone="present"
        />

        <SummaryTile
          icon={Clock}
          label="Late"
          value={summary.Late}
          tone="late"
        />

        <SummaryTile
          icon={UserX}
          label="Absent"
          value={summary.Absent}
          tone="absent"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading students...
            </p>
          ) : roster.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No students found in this class.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adm No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead className="text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {roster.map((student) => {
                    const current = statusFor(student.id)

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-muted-foreground">
                          {student.admissionNo}
                        </TableCell>

                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {student.stream || '—'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            {STATUSES.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() =>
                                  setDraft((currentDraft) => ({
                                    ...currentDraft,
                                    [student.id]: status,
                                  }))
                                }
                                className={cn(
                                  'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                                  current === status
                                    ? status === 'Present'
                                      ? 'border-transparent bg-primary text-primary-foreground'
                                      : status === 'Late'
                                        ? 'border-transparent bg-amber-500 text-white'
                                        : 'border-transparent bg-destructive text-white'
                                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                )}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone: 'present' | 'late' | 'absent'
}) {
  const toneClass =
    tone === 'present'
      ? 'bg-primary/10 text-primary'
      : tone === 'late'
        ? 'bg-amber-500/10 text-amber-600'
        : 'bg-destructive/10 text-destructive'

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-lg',
            toneClass
          )}
        >
          <Icon className="size-5" />
        </span>

        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  )
            }
