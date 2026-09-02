'use client'

import { useMemo, useState } from 'react'
import { useSchool } from '@/lib/store'
import { ReportCard } from '@/components/report-card'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { studentName } from '@/lib/data'
import { Printer } from 'lucide-react'

export default function ReportsPage() {
  const { data } = useSchool()
  const [classId, setClassId] = useState(data.classes[0]?.id ?? '')
  const roster = useMemo(
    () => data.students.filter((s) => s.classId === classId && s.status === 'Active'),
    [data.students, classId],
  )
  const [studentId, setStudentId] = useState(roster[0]?.id ?? '')
  const [examId, setExamId] = useState(data.exams[1]?.id ?? data.exams[0]?.id ?? '')

  const activeStudentId = roster.some((s) => s.id === studentId) ? studentId : roster[0]?.id ?? ''

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Report Forms"
        description="Generate end-of-term report cards with automatic grading."
        actions={
          <Button onClick={() => window.print()} className="print:hidden">
            <Printer className="size-4" />
            Print
          </Button>
        }
      />

      <Card className="print:hidden">
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label>Class</Label>
            <Select
              value={classId}
              onValueChange={(v) => {
                setClassId(v ?? '')
                const first = data.students.find((s) => s.classId === v)
                setStudentId(first?.id ?? '')
              }}
            >
              <SelectTrigger className="w-40">
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
            <Label>Student</Label>
            <Select value={activeStudentId} onValueChange={(value) => setStudentId(value ?? "")}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roster.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {studentName(s)} · {s.admissionNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Exam</Label>
            <Select value={examId} onValueChange={(value) => setExamId(value ?? "")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {activeStudentId ? (
        <ReportCard studentId={activeStudentId} examId={examId} />
      ) : (
        <p className="text-muted-foreground">No students in this class.</p>
      )}
    </div>
  )
}
