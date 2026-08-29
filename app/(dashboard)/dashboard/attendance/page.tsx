'use client'

import { useMemo, useState } from 'react'
import { useSchool } from '@/lib/store'
import { studentName, type AttendanceStatus } from '@/lib/data'
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

const TODAY = '2026-08-28'
const STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Late']

export default function AttendancePage() {
  const { data, setStudentAttendance } = useSchool()
  const [classId, setClassId] = useState(data.classes[0]?.id ?? '')
  const [date, setDate] = useState(TODAY)
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})

  const roster = useMemo(
    () => data.students.filter((s) => s.classId === classId && s.status === 'Active'),
    [data.students, classId],
  )

  function statusFor(studentId: string): AttendanceStatus {
    if (draft[studentId]) return draft[studentId]
    const existing = data.studentAttendance.find((a) => a.studentId === studentId && a.date === date)
    return existing?.status ?? 'Present'
  }

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { Present: 0, Absent: 0, Late: 0 }
    roster.forEach((s) => {
      counts[statusFor(s.id)]++
    })
    return counts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, draft, date, data.studentAttendance])

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {}
    roster.forEach((s) => (next[s.id] = status))
    setDraft(next)
  }

  function save() {
    const records = roster.map((s) => ({ studentId: s.id, status: statusFor(s.id) }))
    setStudentAttendance(date, records)
    setDraft({})
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Attendance"
        description="Mark and review daily student attendance per class."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="att-class">Class</Label>
            <Select value={classId} onValueChange={(v) => { setClassId(v); setDraft({}) }}>
              <SelectTrigger id="att-class" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
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
              onChange={(e) => { setDate(e.target.value); setDraft({}) }}
              className="w-44"
            />
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
            <Button variant="outline" size="sm" onClick={() => markAll('Present')}>
              Mark all present
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAll('Absent')}>
              Mark all absent
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile icon={CheckCircle2} label="Present" value={summary.Present} tone="present" />
        <SummaryTile icon={Clock} label="Late" value={summary.Late} tone="late" />
        <SummaryTile icon={UserX} label="Absent" value={summary.Absent} tone="absent" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adm No.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((s) => {
                const current = statusFor(s.id)
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-muted-foreground">{s.admissionNo}</TableCell>
                    <TableCell className="font-medium">{studentName(s)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.stream}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, [s.id]: st }))}
                            className={cn(
                              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                              current === st
                                ? st === 'Present'
                                  ? 'border-transparent bg-primary text-primary-foreground'
                                  : st === 'Late'
                                    ? 'border-transparent bg-amber-500 text-white'
                                    : 'border-transparent bg-destructive text-white'
                                : 'border-border bg-background text-muted-foreground hover:bg-muted',
                            )}
                          >
                            {st}
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
            <Button onClick={save}>Save Attendance</Button>
          </div>
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
        <span className={cn('flex size-10 items-center justify-center rounded-lg', toneClass)}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
