'use client'

import { useMemo, useState } from 'react'
import { useSchool } from '@/lib/store'
import { studentName } from '@/lib/data'
import { getGrade, gradeColor, meanGradeFromPoints } from '@/lib/grading'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClipboardList, Plus, Trophy } from 'lucide-react'

const CORE_SUBJECTS = ['sub-eng', 'sub-kis', 'sub-mat', 'sub-bio', 'sub-che', 'sub-his', 'sub-geo', 'sub-bst']

export default function ExamsPage() {
  const { data, addExam, saveMarks } = useSchool()
  const [selectedExam, setSelectedExam] = useState(data.exams[1]?.id ?? data.exams[0]?.id ?? '')
  const [entryClass, setEntryClass] = useState(data.classes[0]?.id ?? '')
  const [entrySubject, setEntrySubject] = useState('sub-mat')
  const [draft, setDraft] = useState<Record<string, string>>({})

  // create exam dialog
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [term, setTerm] = useState(data.school.currentTerm)

  const subjectsUsed = useMemo(
    () => data.subjects.filter((s) => CORE_SUBJECTS.includes(s.id)),
    [data.subjects],
  )

  const roster = useMemo(
    () => data.students.filter((s) => s.classId === entryClass && s.status === 'Active'),
    [data.students, entryClass],
  )

  function existingScore(studentId: string) {
    return data.marks.find(
      (m) => m.examId === selectedExam && m.studentId === studentId && m.subjectId === entrySubject,
    )?.score
  }

  function handleSaveMarks() {
    const entries = roster
      .map((s) => {
        const raw = draft[s.id]
        const val = raw !== undefined ? Number(raw) : existingScore(s.id)
        if (val === undefined || Number.isNaN(val)) return null
        return { studentId: s.id, subjectId: entrySubject, score: Math.max(0, Math.min(100, val)) }
      })
      .filter((e): e is { studentId: string; subjectId: string; score: number } => e !== null)
    saveMarks(selectedExam, entries)
    setDraft({})
  }

  function handleCreateExam() {
    if (!name.trim()) return
    addExam({ name: name.trim(), term, year: data.school.currentYear, outOf: 100 })
    setName('')
    setOpen(false)
  }

  // results / ranking for selected exam + class
  const ranking = useMemo(() => {
    const rows = roster.map((s) => {
      const studentMarks = data.marks.filter((m) => m.examId === selectedExam && m.studentId === s.id)
      const total = studentMarks.reduce((sum, m) => sum + m.score, 0)
      const count = studentMarks.length
      const avg = count ? total / count : 0
      const points = count
        ? studentMarks.reduce((sum, m) => sum + getGrade(m.score).points, 0) / count
        : 0
      return { student: s, total, count, avg, meanGrade: meanGradeFromPoints(points) }
    })
    return rows
      .filter((r) => r.count > 0)
      .sort((a, b) => b.avg - a.avg)
      .map((r, i) => ({ ...r, position: i + 1 }))
  }, [roster, data.marks, selectedExam])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Examination Management"
        description="Create exams, enter marks and view automatically graded results."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                New Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Examination</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exm-name">Exam name</Label>
                  <Input
                    id="exm-name"
                    placeholder="e.g. End of Term 2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exm-term">Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger id="exm-term">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateExam}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.exams.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setSelectedExam(e.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
              selectedExam === e.id ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted',
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <p className="font-medium">{e.name}</p>
              <p className="text-sm text-muted-foreground">
                {e.term} · {e.year}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Tabs defaultValue="entry">
        <TabsList>
          <TabsTrigger value="entry">Marks Entry</TabsTrigger>
          <TabsTrigger value="results">Results &amp; Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enter Marks</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Class</Label>
                  <Select value={entryClass} onValueChange={(v) => { setEntryClass(v); setDraft({}) }}>
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
                  <Label>Subject</Label>
                  <Select value={entrySubject} onValueChange={(v) => { setEntrySubject(v); setDraft({}) }}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsUsed.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adm No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-32">Score / 100</TableHead>
                    <TableHead className="text-right">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((s) => {
                    const raw = draft[s.id] !== undefined ? draft[s.id] : existingScore(s.id)?.toString() ?? ''
                    const num = Number(raw)
                    const grade = raw !== '' && !Number.isNaN(num) ? getGrade(num) : null
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-muted-foreground">{s.admissionNo}</TableCell>
                        <TableCell className="font-medium">{studentName(s)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={raw}
                            onChange={(e) => setDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                            className="h-9 w-24"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {grade ? (
                            <Badge variant="outline" className={cn('font-mono', gradeColor(grade.grade))}>
                              {grade.grade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end">
                <Button onClick={handleSaveMarks}>Save Marks</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {data.classes.find((c) => c.id === entryClass)?.name} · Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={entryClass} onValueChange={setEntryClass}>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pos.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Average</TableHead>
                    <TableHead className="text-right">Mean Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No marks recorded for this exam yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {ranking.map((r) => (
                    <TableRow key={r.student.id}>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 font-medium',
                            r.position <= 3 && 'text-primary',
                          )}
                        >
                          {r.position <= 3 && <Trophy className="size-3.5" />}
                          {r.position}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{studentName(r.student)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.avg.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={cn('font-mono', gradeColor(r.meanGrade))}>
                          {r.meanGrade}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
