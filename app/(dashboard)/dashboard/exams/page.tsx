'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSchool } from '@/lib/store'
import { studentName } from '@/lib/data'
import { getGrade, gradeColor, meanGradeFromPoints } from '@/lib/grading'
import { PageHeader } from '@/components/page-header'
import {
Card,
CardContent,
CardHeader,
CardTitle,
} from '@/components/ui/card'
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
import {
Dialog,
DialogContent,
DialogFooter,
DialogHeader,
DialogTitle,
DialogTrigger,
} from '@/components/ui/dialog'
import { ClipboardList, Download, Plus, Trophy } from 'lucide-react'

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

const REPORT_SUBJECT_NAMES = [
'English',
'Kiswahili',
'Mathematics',
'Integrated Science',
'Pre-Technical Studies',
'Social Studies',
'Religious Education',
'Agriculture',
'Creative Arts',
]

function normalizeClassName(value: unknown) {
const name = String(value ?? '')
.trim()
.toLowerCase()
.replace(/\s+/g, ' ')

if (
name === 'play group' ||
name === 'playgroup' ||
name === 'play-group'
) {
return 'playgroup'
}

if (
name === 'preprimary 1' ||
name === 'pre-primary 1' ||
name === 'pre primary 1' ||
name === 'pp1'
) {
return 'pp1'
}

if (
name === 'preprimary 2' ||
name === 'pre-primary 2' ||
name === 'pre primary 2' ||
name === 'pp2'
) {
return 'pp2'
}

return name
}

function classSortNumber(name: string) {
const normalized = normalizeClassName(name)

if (normalized === 'playgroup') return 0
if (normalized === 'pp1') return 1
if (normalized === 'pp2') return 2

const match = normalized.match(/^grade\s+(\d+)$/)

if (match) {
return 2 + Number(match[1])
}

return 100
}

function displayClassName(name: string) {
const normalized = normalizeClassName(name)

if (normalized === 'playgroup') return 'Playgroup'
if (normalized === 'pp1') return 'PP1'
if (normalized === 'pp2') return 'PP2'

const match = normalized.match(/^grade\s+(\d+)$/)

if (match) {
return `Grade ${match[1]}`
}

return name
}

function subjectMatchesReportName(subjectName: string) {
const normalized = subjectName
.trim()
.toLowerCase()

return REPORT_SUBJECT_NAMES.some(
(name) => name.toLowerCase() === normalized,
)
}

export default function ExamsPage() {
const { data, addExam, saveMarks, role } = useSchool()

const [selectedExam, setSelectedExam] = useState(
data.exams[1]?.id ??
data.exams[0]?.id ??
'',
)

const [entryClass, setEntryClass] = useState(
data.classes[0]?.id ?? '',
)

const [entrySubject, setEntrySubject] = useState(
data.subjects.find((subject) =>
String(subject.name ?? '')
.toLowerCase()
.includes('mathematics'),
)?.id ??
data.subjects[0]?.id ??
'',
)

const [draft, setDraft] = useState<
Record<string, string>

> ({})

const [open, setOpen] = useState(false)
const [name, setName] = useState('')
const [term, setTerm] = useState(
data.school.currentTerm,
)

const sortedClasses = useMemo(() => {
return [...data.classes].sort((a, b) => {
const orderA = classSortNumber(a.name)
const orderB = classSortNumber(b.name)


  if (orderA !== orderB) {
    return orderA - orderB
  }

  return String(a.name).localeCompare(
    String(b.name),
  )
})

}, [data.classes])

useEffect(() => {
if (sortedClasses.length === 0) {
setEntryClass('')
return
}


const classExists = sortedClasses.some(
  (item) => String(item.id) === String(entryClass),
)

if (!classExists) {
  setEntryClass(sortedClasses[0].id)
  setDraft({})
}

}, [sortedClasses, entryClass])

useEffect(() => {
if (data.exams.length === 0) {
setSelectedExam('')
return
}


const examExists = data.exams.some(
  (exam) =>
    String(exam.id) === String(selectedExam),
)

if (!examExists) {
  setSelectedExam(
    data.exams[1]?.id ??
      data.exams[0]?.id ??
      '',
  )
}

}, [data.exams, selectedExam])

const subjectsUsed = useMemo(() => {
const reportSubjects = data.subjects.filter(
(subject) =>
subjectMatchesReportName(
String(subject.name ?? ''),
),
)

if (reportSubjects.length > 0) {
  return reportSubjects
}

return data.subjects
}, [data.subjects])

useEffect(() => {
if (subjectsUsed.length === 0) {
setEntrySubject('')
return
}

const exists = subjectsUsed.some(
  (subject) =>
    String(subject.id) ===
    String(entrySubject),
)

if (!exists) {
  setEntrySubject(subjectsUsed[0].id)
  setDraft({})
}

}, [subjectsUsed, entrySubject])

const selectedClass = useMemo(
() =>
data.classes.find(
(item) =>
String(item.id) ===
String(entryClass),
),
[data.classes, entryClass],
)

const roster = useMemo(() => {
if (!selectedClass) {
return []
}


const selectedClassName = normalizeClassName(
  selectedClass.name,
)

return data.students
  .filter((student) => {
    if (
      String(student.status ?? '')
        .toLowerCase() !== 'active'
    ) {
      return false
    }

    const classFromName =
      normalizeClassName(student.className)

    const classFromId =
      normalizeClassName(student.classId)

    return (
      classFromName === selectedClassName ||
      classFromId === selectedClassName
    )
  })
  .sort((a, b) =>
    studentName(a).localeCompare(
      studentName(b),
    ),
  )

}, [data.students, selectedClass])

function existingScore(studentId: string) {
return data.marks.find(
(mark) =>
String(mark.examId) ===
String(selectedExam) &&
String(mark.studentId) ===
String(studentId) &&
String(mark.subjectId) ===
String(entrySubject),
)?.score
}

function handleSaveMarks() {
if (!selectedExam || !entrySubject) {
return
}


const entries = roster
  .map((student) => {
    const raw = draft[student.id]

    const val =
      raw !== undefined
        ? Number(raw)
        : existingScore(student.id)

    if (
      val === undefined ||
      Number.isNaN(val)
    ) {
      return null
    }

    return {
      studentId: student.id,
      subjectId: entrySubject,
      score: Math.max(
        0,
        Math.min(100, val),
      ),
    }
  })
  .filter(
    (
      entry,
    ): entry is {
      studentId: string
      subjectId: string
      score: number
    } => entry !== null,
  )

if (entries.length === 0) {
  return
}

saveMarks(selectedExam, entries)
setDraft({})


}

function handleCreateExam() {
if (!name.trim()) {
return
}


addExam({
  name: name.trim(),
  term,
  year: data.school.currentYear,
  outOf: 100,
})

setName('')
setOpen(false)

}

function csvEscape(value: unknown) {
const text = String(value ?? '')
return `"${text.replace(/"/g, '""')}"`
}

function downloadMarkSheet() {
if (!selectedClass || roster.length === 0) {
return
}

const selectedSubjectList =
  subjectsUsed.length > 0
    ? subjectsUsed
    : data.subjects

const headers = [
  'No.',
  'Admission Number',
  'Learner Name',
  'Stream',
  ...selectedSubjectList.map(
    (subject) => subject.name,
  ),
  'Total',
  'Average',
]

const rows = roster.map(
  (student, index) => [
    index + 1,
    student.admissionNo,
    studentName(student),
    student.stream ?? '',
    ...selectedSubjectList.map(
      () => '',
    ),
    '',
    '',
  ],
)

const csv = [
  [
    'KANYUNGA COMPREHENSIVE SCHOOL',
  ].map(csvEscape).join(','),
  [
    'EXAMINATION MARK SHEET',
  ].map(csvEscape).join(','),
  [
    'Examination',
    data.exams.find(
      (exam) =>
        String(exam.id) ===
        String(selectedExam),
    )?.name ?? '',
  ]
    .map(csvEscape)
    .join(','),
  [
    'Class',
    displayClassName(
      selectedClass.name,
    ),
  ]
    .map(csvEscape)
    .join(','),
  [
    'Term',
    data.exams.find(
      (exam) =>
        String(exam.id) ===
        String(selectedExam),
    )?.term ?? '',
  ]
    .map(csvEscape)
    .join(','),
  [
    'Year',
    data.exams.find(
      (exam) =>
        String(exam.id) ===
        String(selectedExam),
    )?.year ?? data.school.currentYear,
  ]
    .map(csvEscape)
    .join(','),
  '',
  headers.map(csvEscape).join(','),
  ...rows.map((row) =>
    row.map(csvEscape).join(','),
  ),
].join('\n')

const blob = new Blob([csv], {
  type: 'text/csv;charset=utf-8;',
})

const url = URL.createObjectURL(blob)

const link = document.createElement('a')
link.href = url

const safeClass = displayClassName(
  selectedClass.name,
)
  .replace(/\s+/g, '-')
  .toLowerCase()

const examName =
  data.exams.find(
    (exam) =>
      String(exam.id) ===
      String(selectedExam),
  )?.name ?? 'Exam'

const safeExam = examName
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase()

link.download = `${safeClass}-${safeExam}-mark-sheet.csv`

document.body.appendChild(link)
link.click()
document.body.removeChild(link)

URL.revokeObjectURL(url)

}

const ranking = useMemo(() => {
const rows = roster.map((student) => {
const studentMarks =
data.marks.filter(
(mark) =>
String(mark.examId) ===
String(selectedExam) &&
String(mark.studentId) ===
String(student.id),
)


  const total = studentMarks.reduce(
    (sum, mark) =>
      sum + Number(mark.score),
    0,
  )

  const count = studentMarks.length

  const avg = count
    ? total / count
    : 0

  const points = count
    ? studentMarks.reduce(
        (sum, mark) =>
          sum +
          getGrade(
            Number(mark.score),
          ).points,
        0,
      ) / count
    : 0

  return {
    student,
    total,
    count,
    avg,
    meanGrade:
      meanGradeFromPoints(points),
  }
})

return rows
  .filter((row) => row.count > 0)
  .sort((a, b) => b.avg - a.avg)
  .map((row, index) => ({
    ...row,
    position: index + 1,
  }))

}, [
roster,
data.marks,
selectedExam,
])

return ( <div className="flex flex-col gap-6">
<PageHeader
title="Examination Management"
description="Create examinations, enter marks, download class mark sheets and view results."
actions={
role === 'admin' ? ( <Dialog
           open={open}
           onOpenChange={setOpen}
         >
<DialogTrigger
render={<Button />}
> <Plus className="size-4" />
New Exam </DialogTrigger>

  <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Create Examination
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="exm-name">
                  Exam name
                </Label>

                <Input
                  id="exm-name"
                  placeholder="e.g. End of Term 2"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="exm-term">
                  Term
                </Label>

                <select
                  id="exm-term"
                  value={term}
                  onChange={(event) =>
                    setTerm(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="Term 1">
                    Term 1
                  </option>
                  <option value="Term 2">
                    Term 2
                  </option>
                  <option value="Term 3">
                    Term 3
                  </option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                onClick={handleCreateExam}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null
    }
  />

  {data.exams.length > 0 && (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.exams.map((exam) => (
        <button
          key={exam.id}
          type="button"
          onClick={() =>
            setSelectedExam(exam.id)
          }
          className={cn(
            'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
            selectedExam === exam.id
              ? 'border-primary bg-primary/5'
              : 'bg-card hover:bg-muted',
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </span>

          <div>
            <p className="font-medium">
              {exam.name}
            </p>

            <p className="text-sm text-muted-foreground">
              {exam.term} · {exam.year}
            </p>
          </div>
        </button>
      ))}
    </div>
  )}

  {data.exams.length === 0 && (
    <Card>
      <CardContent className="p-8 text-center text-muted-foreground">
        No examinations have been created yet.
      </CardContent>
    </Card>
  )}

  <div className="flex flex-col gap-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Examination Selection
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>
              Class
            </Label>

            <select
              value={entryClass}
              onChange={(event) => {
                setEntryClass(
                  event.target.value,
                )
                setDraft({})
              }}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">
                Select class
              </option>

              {sortedClasses.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {displayClassName(
                    item.name,
                  )}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              Subject
            </Label>

            <select
              value={entrySubject}
              onChange={(event) => {
                setEntrySubject(
                  event.target.value,
                )
                setDraft({})
              }}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">
                Select subject
              </option>

              {subjectsUsed.map(
                (subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-semibold">
          {selectedClass
            ? displayClassName(
                selectedClass.name,
              )
            : 'No class selected'}
        </p>

        <p className="text-sm text-muted-foreground">
          {roster.length}{' '}
          {roster.length === 1
            ? 'learner'
            : 'learners'}
        </p>
      </div>

      <Button
        variant="outline"
        onClick={downloadMarkSheet}
        disabled={
          !selectedClass ||
          roster.length === 0 ||
          subjectsUsed.length === 0
        }
      >
        <Download className="mr-2 size-4" />
        Download Mark Sheet
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Enter Marks
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {roster.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="font-medium">
              No learners found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              There are no active learners
              registered in this class yet.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {selectedClass
                      ? displayClassName(
                          selectedClass.name,
                        )
                      : ''}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {roster.length} learners
                    ·{' '}
                    {subjectsUsed.length}{' '}
                    subjects
                  </p>
                </div>

                <Badge variant="secondary">
                  {data.exams.find(
                    (exam) =>
                      String(exam.id) ===
                      String(selectedExam),
                  )?.name ??
                    'Examination'}
                </Badge>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Adm No.
                  </TableHead>

                  <TableHead>
                    Learner
                  </TableHead>

                  <TableHead>
                    Stream
                  </TableHead>

                  <TableHead className="w-32">
                    Score / 100
                  </TableHead>

                  <TableHead className="text-right">
                    Grade
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {roster.map((student) => {
                  const raw =
                    draft[student.id] !==
                    undefined
                      ? draft[student.id]
                      : existingScore(
                          student.id,
                        )?.toString() ??
                        ''

                  const num = Number(raw)

                  const grade =
                    raw !== '' &&
                    !Number.isNaN(num)
                      ? getGrade(num)
                      : null

                  return (
                    <TableRow
                      key={student.id}
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        {student.admissionNo}
                      </TableCell>

                      <TableCell className="font-medium">
                        {studentName(student)}
                      </TableCell>

                      <TableCell>
                        {student.stream ??
                          '—'}
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={raw}
                          onChange={(
                            event,
                          ) =>
                            setDraft(
                              (current) => ({
                              
