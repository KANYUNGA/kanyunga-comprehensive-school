
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSchool } from '@/lib/store'
import { studentName } from '@/lib/data'
import { getGrade, meanGradeFromPoints } from '@/lib/grading'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ClipboardList,
  Download,
  Plus,
  Trophy,
} from 'lucide-react'

const CLASS_ORDER = [
  'playgroup',
  'pp1',
  'pp2',
  'grade 1',
  'grade 2',
  'grade 3',
  'grade 4',
  'grade 5',
  'grade 6',
  'grade 7',
  'grade 8',
  'grade 9',
]

function normalizeClassName(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^play group$/, 'playgroup')
    .replace(/^pre ?primary 1$/, 'pp1')
    .replace(/^pre-primary 1$/, 'pp1')
    .replace(/^pre ?primary 2$/, 'pp2')
    .replace(/^pre-primary 2$/, 'pp2')
}

function classDisplayName(name: string) {
  const normalized = normalizeClassName(name)

  if (normalized === 'playgroup') return 'Playgroup'
  if (normalized === 'pp1') return 'PP1'
  if (normalized === 'pp2') return 'PP2'

  return name
}

export default function ExamsPage() {
  const { data, addExam, saveMarks, role } = useSchool()

  const [selectedExam, setSelectedExam] = useState(
    data.exams[0]?.id ?? '',
  )

  const [entryClass, setEntryClass] = useState(
    data.classes[0]?.id ?? '',
  )

  const [entrySubject, setEntrySubject] = useState(
    data.subjects[0]?.id ?? '',
  )

  const [draft, setDraft] = useState<Record<string, string>>({})

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [term, setTerm] = useState(
    data.school.currentTerm,
  )

  const sortedClasses = useMemo(() => {
    return [...data.classes].sort((a, b) => {
      const aIndex = CLASS_ORDER.indexOf(
        normalizeClassName(a.name),
      )

      const bIndex = CLASS_ORDER.indexOf(
        normalizeClassName(b.name),
      )

      const safeA = aIndex === -1 ? 999 : aIndex
      const safeB = bIndex === -1 ? 999 : bIndex

      return safeA - safeB
    })
  }, [data.classes])

  useEffect(() => {
    if (!selectedExam && data.exams.length > 0) {
      setSelectedExam(data.exams[0].id)
    }
  }, [data.exams, selectedExam])

  useEffect(() => {
    if (sortedClasses.length === 0) return

    const exists = sortedClasses.some(
      (classItem) => classItem.id === entryClass,
    )

    if (!exists) {
      setEntryClass(sortedClasses[0].id)
      setDraft({})
    }
  }, [sortedClasses, entryClass])

  const selectedClass = useMemo(() => {
    return sortedClasses.find(
      (classItem) => classItem.id === entryClass,
    )
  }, [sortedClasses, entryClass])

  const subjectsUsed = useMemo(() => {
    const reportSubjectNames = [
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

    const matched = data.subjects.filter((subject) =>
      reportSubjectNames.some(
        (subjectNameValue) =>
          subject.name?.toLowerCase() ===
          subjectNameValue.toLowerCase(),
      ),
    )

    return matched.length > 0 ? matched : data.subjects
  }, [data.subjects])

  useEffect(() => {
    if (subjectsUsed.length === 0) return

    const exists = subjectsUsed.some(
      (subject) => subject.id === entrySubject,
    )

    if (!exists) {
      setEntrySubject(subjectsUsed[0].id)
      setDraft({})
    }
  }, [subjectsUsed, entrySubject])

  const roster = useMemo(() => {
    if (!selectedClass) return []

    const selectedClassName = normalizeClassName(
      selectedClass.name,
    )

    return data.students
      .filter((student) => {
        if (student.status !== 'Active') return false

        const studentClassName = normalizeClassName(
          String(student.className || ''),
        )

        const studentClassId = normalizeClassName(
          String(student.classId || ''),
        )

        return (
          studentClassName === selectedClassName ||
          studentClassId === selectedClassName
        )
      })
      .sort((a, b) =>
        String(a.admissionNo || '').localeCompare(
          String(b.admissionNo || ''),
        ),
      )
  }, [data.students, selectedClass])

  function existingScore(studentId: string) {
    return data.marks.find(
      (mark) =>
        mark.examId === selectedExam &&
        mark.studentId === studentId &&
        mark.subjectId === entrySubject,
    )?.score
  }

  function handleSaveMarks() {
    if (!selectedExam || !entrySubject) return

    const entries = roster
      .map((student) => {
        const raw = draft[student.id]

        const value =
          raw !== undefined
            ? Number(raw)
            : existingScore(student.id)

        if (value === undefined || Number.isNaN(value)) {
          return null
        }

        return {
          studentId: student.id,
          subjectId: entrySubject,
          score: Math.max(
            0,
            Math.min(100, value),
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

    if (entries.length === 0) return

    saveMarks(selectedExam, entries)
    setDraft({})
  }

  function handleCreateExam() {
    if (!name.trim()) return

    addExam({
      name: name.trim(),
      term,
      year: data.school.currentYear,
      outOf: 100,
    })

    setName('')
    setOpen(false)
  }

  function csvValue(value: string | number | undefined) {
    const text = String(value ?? '')

    return `"${text.replace(/"/g, '""')}"`
  }

  function downloadMarkSheet() {
    if (!selectedClass) return

    const headers = [
      'No.',
      'Admission Number',
      'Learner Name',
      'Stream',
      ...subjectsUsed.map(
        (subject) => subject.name,
      ),
      'Total',
      'Average',
    ]

    const rows = roster.map((student, index) => {
      let total = 0
      let count = 0

      const scores = subjectsUsed.map((subject) => {
        const mark = data.marks.find(
          (item) =>
            item.examId === selectedExam &&
            item.studentId === student.id &&
            item.subjectId === subject.id,
        )

        if (mark?.score !== undefined) {
          total += Number(mark.score)
          count += 1
          return mark.score
        }

        return ''
      })

      const average =
        count > 0
          ? (total / count).toFixed(2)
          : ''

      return [
        index + 1,
        student.admissionNo,
        studentName(student),
        student.stream || '',
        ...scores,
        total || '',
        average,
      ]
    })

    const csv = [
      headers.map(csvValue).join(','),
      ...rows.map((row) =>
        row.map(csvValue).join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url

    const fileClassName = classDisplayName(
      selectedClass.name,
    ).replace(/\s+/g, '-')

    link.download = `${fileClassName}-mark-sheet.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const ranking = useMemo(() => {
    const rows = roster.map((student) => {
      const studentMarks = data.marks.filter(
        (mark) =>
          mark.examId === selectedExam &&
          mark.studentId === student.id,
      )

      const total = studentMarks.reduce(
        (sum, mark) =>
          sum + Number(mark.score),
        0,
      )

      const count = studentMarks.length

      const average =
        count > 0 ? total / count : 0

      const points =
        count > 0
          ? studentMarks.reduce(
              (sum, mark) =>
                sum +
                getGrade(mark.score).points,
              0,
            ) / count
          : 0

      return {
        student,
        total,
        count,
        average,
        meanGrade:
          meanGradeFromPoints(points),
      }
    })

    return rows
      .filter((row) => row.count > 0)
      .sort(
        (a, b) => b.average - a.average,
      )
      .map((row, index) => ({
        ...row,
        position: index + 1,
      }))
  }, [
    roster,
    data.marks,
    selectedExam,
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        description="Create examinations, enter learner marks and download mark sheets."
        icon={ClipboardList}
      >
        {role === 'admin' && (
          <Dialog
            open={open}
            onOpenChange={setOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Exam
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Create Examination
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>
                    Examination Name
                  </Label>

                  <Input
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Term 2 Assessment"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Term</Label>

                  <select
                    value={term}
                    onChange={(event) =>
                      setTerm(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
                  onClick={handleCreateExam}
                >
                  Create Examination
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>
            Mark Entry
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>
                Examination
              </Label>

              <select
                value={selectedExam}
                onChange={(event) => {
                  setSelectedExam(
                    event.target.value,
                  )
                  setDraft({})
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {data.exams.length === 0 ? (
                  <option value="">
                    No examinations
                  </option>
                ) : (
                  data.exams.map((exam) => (
                    <option
                      key={exam.id}
                      value={exam.id}
                    >
                      {exam.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
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
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {sortedClasses.map(
                  (classItem) => (
                    <option
                      key={classItem.id}
                      value={classItem.id}
                    >
                      {classDisplayName(
                        classItem.name,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="space-y-2">
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
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
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

            <div className="flex items-end">
              <Button
                onClick={
                  downloadMarkSheet
                }
                variant="outline"
                className="w-full"
                disabled={
                  !selectedClass ||
                  roster.length === 0
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Download Mark Sheet
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              {classDisplayName(
                selectedClass?.name || '',
              )}
            </Badge>

            <Badge variant="outline">
              {roster.length} learners
            </Badge>

            {selectedExam && (
              <Badge variant="outline">
                {data.exams.find(
                  (exam) =>
                    exam.id ===
                    selectedExam,
                )?.name ||
                  'Examination'}
              </Badge>
            )}
          </div>

          {roster.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">
                No learners found
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                There are no active learners
                registered in{' '}
                {classDisplayName(
                  selectedClass?.name ||
                    'this class',
                )}
                .
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        No.
                      </TableHead>

                      <TableHead>
                        Admission No.
                      </TableHead>

                      <TableHead>
                        Learner
                      </TableHead>

                      <TableHead>
                        Stream
                      </TableHead>

                      <TableHead>
                        Score / 100
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {roster.map(
                      (
                        student,
                        index,
                      ) => {
                        const savedScore =
                          existingScore(
                            student.id,
                          )

                        return (
                          <TableRow
                            key={
                              student.id
                            }
                          >
                            <TableCell>
                              {index + 1}
                            </TableCell>

                            <TableCell>
                              {
                                student.admissionNo
                              }
                            </TableCell>

                            <TableCell className="font-medium">
                              {studentName(
                                student,
                              )}
                            </TableCell>

                            <TableCell>
                              {student.stream ||
                                '-'}
                            </TableCell>

                            <TableCell className="w-40">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  draft[
                                    student.id
                                  ] ??
                                  (savedScore !==
                                  undefined
                                    ? String(
                                        savedScore,
                                      )
                                    : '')
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setDraft(
                                    (
                                      current,
                                    ) => ({
                                      ...current,
                                      [student.id]:
                                        event
                                          .target
                                          .value,
                                    }),
                                  )
                                }
                                placeholder="Enter score"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      },
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={
                    handleSaveMarks
                  }
                  disabled={
                    !selectedExam ||
                    !entrySubject
                  }
                >
                  Save Marks
                </Button>

                <Button
                  variant="outline"
                  onClick={
                    downloadMarkSheet
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Mark Sheet
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Results & Ranking
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <Label>
              Class
            </Label>

            <select
              value={entryClass}
              onChange={(event) =>
                setEntryClass(
                  event.target.value,
                )
              }
              className="mt-2 w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
            >
              {sortedClasses.map(
                (classItem) => (
                  <option
                    key={classItem.id}
                    value={classItem.id}
                  >
                    {classDisplayName(
                      classItem.name,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>

          {ranking.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">
                No results available
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Enter and save marks to see
                the ranking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Position
                    </TableHead>

                    <TableHead>
                      Admission No.
                    </TableHead>

                    <TableHead>
                      Learner
                    </TableHead>

                    <TableHead>
                      Subjects
                    </TableHead>

                    <TableHead>
                      Total
                    </TableHead>

                    <TableHead>
                      Average
                    </TableHead>

                    <TableHead>
                      Mean Grade
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {ranking.map(
                    (row) => (
                      <TableRow
                        key={
                          row.student.id
                        }
                      >
                        <TableCell className="font-bold">
                          {row.position}
                        </TableCell>

                        <TableCell>
                          {
                            row.student
                              .admissionNo
                          }
                        </TableCell>

                        <TableCell className="font-medium">
                          {studentName(
                            row.student,
                          )}
                        </TableCell>

                        <TableCell>
                          {row.count}
                        </TableCell>

                        <TableCell>
                          {row.total}
                        </TableCell>

                        <TableCell>
                          {row.average.toFixed(
                            2,
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge>
                            {
                              row.meanGrade
                            }
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
