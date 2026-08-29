'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { useSchool } from '@/lib/store'
import { studentName } from '@/lib/data'
import { getGrade, gradeColor, meanGradeFromPoints } from '@/lib/grading'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function ReportCard({ studentId, examId }: { studentId: string; examId: string }) {
  const { data } = useSchool()

  const student = data.students.find((s) => s.id === studentId)
  const exam = data.exams.find((e) => e.id === examId)
  const cls = data.classes.find((c) => c.id === student?.classId)

  const rows = useMemo(() => {
    if (!student) return []
    return data.marks
      .filter((m) => m.examId === examId && m.studentId === studentId)
      .map((m) => {
        const subject = data.subjects.find((s) => s.id === m.subjectId)
        const g = getGrade(m.score)
        return { subject: subject?.name ?? m.subjectId, score: m.score, ...g }
      })
      .sort((a, b) => a.subject.localeCompare(b.subject))
  }, [data.marks, data.subjects, examId, studentId, student])

  const summary = useMemo(() => {
    const total = rows.reduce((sum, r) => sum + r.score, 0)
    const count = rows.length
    const avg = count ? total / count : 0
    const avgPoints = count ? rows.reduce((sum, r) => sum + r.points, 0) / count : 0
    return { total, count, avg, meanGrade: meanGradeFromPoints(avgPoints) }
  }, [rows])

  // class position
  const position = useMemo(() => {
    if (!student) return { rank: 0, outOf: 0 }
    const classmates = data.students.filter((s) => s.classId === student.classId)
    const averages = classmates
      .map((s) => {
        const ms = data.marks.filter((m) => m.examId === examId && m.studentId === s.id)
        const avg = ms.length ? ms.reduce((sum, m) => sum + m.score, 0) / ms.length : -1
        return { id: s.id, avg }
      })
      .filter((a) => a.avg >= 0)
      .sort((a, b) => b.avg - a.avg)
    const rank = averages.findIndex((a) => a.id === student.id) + 1
    return { rank, outOf: averages.length }
  }, [data.students, data.marks, examId, student])

  if (!student || !exam) return null

  return (
    <Card className="mx-auto w-full max-w-3xl print:border-0 print:shadow-none">
      <CardContent className="pt-6">
        {/* header */}
        <div className="flex items-center gap-4 border-b pb-4">
          <Image src="/school-crest.png" alt="School crest" width={64} height={64} className="size-16 object-contain" />
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-primary">{data.school.name}</h2>
            <p className="text-sm text-muted-foreground">{data.school.poBox}</p>
            <p className="text-sm text-muted-foreground">
              {data.school.phone} · {data.school.email}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-sm font-semibold">TERMINAL REPORT</p>
            <p className="text-sm text-muted-foreground">
              {exam.term} {exam.year}
            </p>
          </div>
        </div>

        {/* student info */}
        <div className="grid gap-x-8 gap-y-1.5 py-4 text-sm sm:grid-cols-2">
          <InfoRow label="Name" value={studentName(student)} />
          <InfoRow label="Admission No" value={student.admissionNo} />
          <InfoRow label="Class" value={`${cls?.name ?? ''} ${student.stream}`} />
          <InfoRow label="Exam" value={exam.name} />
          <InfoRow
            label="Position"
            value={position.rank ? `${position.rank} out of ${position.outOf}` : 'N/A'}
          />
          <InfoRow label="Mean Grade" value={summary.meanGrade} />
        </div>

        {/* marks table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-right">Grade</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead>Remark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.subject}>
                <TableCell className="font-medium">{r.subject}</TableCell>
                <TableCell className="text-right tabular-nums">{r.score}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn('font-mono', gradeColor(r.grade))}>
                    {r.grade}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.points}</TableCell>
                <TableCell className="text-muted-foreground">{r.remark}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* summary */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SummaryBox label="Total Marks" value={`${summary.total} / ${summary.count * 100}`} />
          <SummaryBox label="Average" value={`${summary.avg.toFixed(1)}%`} />
          <SummaryBox label="Mean Grade" value={summary.meanGrade} highlight />
        </div>

        {/* remarks */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="w-36 shrink-0 font-medium">Class Teacher&apos;s Remark:</span>
            <span className="flex-1 border-b border-dashed text-muted-foreground">
              {summary.avg >= 60
                ? 'A commendable performance. Keep it up.'
                : summary.avg >= 45
                  ? 'Fair effort. More consistency needed.'
                  : 'Needs to work harder next term.'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="w-36 shrink-0 font-medium">Principal&apos;s Remark:</span>
            <span className="flex-1 border-b border-dashed text-muted-foreground">
              {data.school.motto}
            </span>
          </div>
          <div className="flex gap-2 pt-2">
            <span className="w-36 shrink-0 font-medium">Closing Date:</span>
            <span className="flex-1 border-b border-dashed" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function SummaryBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-center',
        highlight ? 'border-primary bg-primary/5' : 'bg-muted/40',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 font-heading text-lg font-bold', highlight && 'text-primary')}>{value}</p>
    </div>
  )
}
