'use client'

import { useMemo, useState } from 'react'
import { useSchool } from '@/lib/store'
import { teacherName, type AttendanceStatus } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, UserX } from 'lucide-react'

const TODAY = '2026-08-28'
const STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Late']

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function TeacherAttendancePage() {
  const { data, setTeacherAttendance } = useSchool()
  const [date, setDate] = useState(TODAY)
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})

  const staff = useMemo(() => data.teachers.filter((t) => t.status === 'Active'), [data.teachers])

  function statusFor(teacherId: string): AttendanceStatus {
    if (draft[teacherId]) return draft[teacherId]
    const existing = data.teacherAttendance.find((a) => a.teacherId === teacherId && a.date === date)
    return existing?.status ?? 'Present'
  }

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { Present: 0, Absent: 0, Late: 0 }
    staff.forEach((t) => counts[statusFor(t.id)]++)
    return counts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, draft, date, data.teacherAttendance])

  function save() {
    const records = staff.map((t) => ({ teacherId: t.id, status: statusFor(t.id) }))
    setTeacherAttendance(date, records)
    setDraft({})
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teacher Attendance"
        description="Record daily staff attendance and clock-ins."
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tatt-date">Date</Label>
            <Input
              id="tatt-date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setDraft({}) }}
              className="w-44"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="size-4 text-primary" /> {summary.Present} Present
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <Clock className="size-4 text-amber-600" /> {summary.Late} Late
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <UserX className="size-4 text-destructive" /> {summary.Absent} Absent
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff No.</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((t) => {
                const current = statusFor(t.id)
                const name = teacherName(t)
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-muted-foreground">{t.staffNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                            {initials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, [t.id]: st }))}
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
