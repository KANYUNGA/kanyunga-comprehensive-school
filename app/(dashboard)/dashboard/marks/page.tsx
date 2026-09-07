'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'

import { useSchool } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Student = {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  classId: string
  stream?: string
  status?: string
}

type Subject = {
  id: string
  name: string
  code: string
  category: string
}

type Exam = {
  id: string
  name: string
  term: string
  year: number
  outOf: number
}

type Mark = {
  id: string
  examId: string
  studentId: string
  subjectId: string
  score: number
}

export default function MarksPage() {
  const { auth } = useSchool()

  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [marks, setMarks] = useState<Mark[]>([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedExam, setSelectedExam] = useState('')

  const [scores, setScores] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  /*
   * Load all marks-related data.
   */
  async function loadData() {
    try {
      setLoading(true)
      setMessage('')

      const [
        studentsResponse,
        subjectsResponse,
        examsResponse,
        marksResponse,
      ] = await Promise.all([
        fetch('/api/students', {
          cache: 'no-store',
        }),
        fetch('/api/subjects', {
          cache: 'no-store',
        }),
        fetch('/api/exams', {
          cache: 'no-store',
        }),
        fetch('/api/marks', {
          cache: 'no-store',
        }),
      ])

      if (!studentsResponse.ok) {
        throw new Error('Failed to load students.')
      }

      if (!subjectsResponse.ok) {
        throw new Error('Failed to load subjects.')
      }

      if (!examsResponse.ok) {
        throw new Error('Failed to load exams.')
      }

      if (!marksResponse.ok) {
        throw new Error('Failed to load marks.')
      }

      const studentsData = await studentsResponse.json()
      const subjectsData = await subjectsResponse.json()
      const examsData = await examsResponse.json()
      const marksData = await marksResponse.json()

      const loadedStudents: Student[] = Array.isArray(
        studentsData
      )
        ? studentsData
        : studentsData.data ??
          studentsData.students ??
          []

      const loadedSubjects: Subject[] = Array.isArray(
        subjectsData
      )
        ? subjectsData
        : subjectsData.data ??
          subjectsData.subjects ??
          []

      const loadedExams: Exam[] = Array.isArray(examsData)
        ? examsData
        : examsData.data ?? examsData.exams ?? []

      const loadedMarks: Mark[] = Array.isArray(marksData)
        ? marksData
        : marksData.data ?? marksData.marks ?? []

      setStudents(loadedStudents)
      setSubjects(loadedSubjects)
      setExams(loadedExams)
      setMarks(loadedMarks)
    } catch (error) {
      console.error('Failed to load marks data:', error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load marks data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  /*
   * Get classes directly from students.
   *
   * Each class becomes its own separate marks sheet.
   */
  const classes = useMemo(() => {
    const uniqueClasses = Array.from(
      new Set(
        students
          .filter(
            (student) => student.status !== 'Inactive'
          )
          .map((student) =>
            String(student.classId ?? '').trim()
          )
          .filter(Boolean)
      )
    )

    return uniqueClasses.sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    )
  }, [students])

  /*
   * Determine the subject category for a selected class.
   */
  function getCategoryForClass(
    className: string
  ): string {
    const value = className.toLowerCase()

    if (
      value.includes('play') ||
      value.includes('pp1') ||
      value.includes('pp2') ||
      value.includes('pre-primary') ||
      value.includes('pre primary')
    ) {
      return 'Pre-primary'
    }

    if (
      value.includes('grade 1') ||
      value.includes('grade 2') ||
      value.includes('grade 3') ||
      value.includes('lower primary')
    ) {
      return 'Lower Primary'
    }

    if (
      value.includes('grade 4') ||
      value.includes('grade 5') ||
      value.includes('grade 6') ||
      value.includes('upper primary')
    ) {
      return 'Upper Primary'
    }

    if (
      value.includes('grade 7') ||
      value.includes('grade 8') ||
      value.includes('grade 9') ||
      value.includes('junior')
    ) {
      return 'Junior School'
    }

    return ''
  }

  /*
   * Subjects/learning areas for the selected class.
   */
  const classSubjects = useMemo(() => {
    if (!selectedClass) {
      return []
    }

    const category =
      getCategoryForClass(selectedClass)

    if (!category) {
      return subjects
    }

    const matching = subjects.filter(
      (subject) =>
        subject.category.toLowerCase() ===
        category.toLowerCase()
    )

    /*
     * If there are no category matches, show all subjects
     * rather than leaving the marks sheet empty.
     */
    return matching.length > 0 ? matching : subjects
  }, [subjects, selectedClass])

  /*
   * Students belonging ONLY to the selected class.
   */
  const classStudents = useMemo(() => {
    if (!selectedClass) {
      return []
    }

    return students
      .filter(
        (student) =>
          String(student.classId ?? '').trim() ===
            selectedClass &&
          student.status !== 'Inactive'
      )
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        )
      )
  }, [students, selectedClass])

  /*
   * Create a unique key for every student + subject combination.
   */
  function scoreKey(
    studentId: string,
    subjectId: string
  ) {
    return `${studentId}__${subjectId}`
  }

  /*
   * Load existing marks whenever class/exam changes.
   */
  useEffect(() => {
    if (!selectedClass || !selectedExam) {
      setScores({})
      return
    }

    const existing: Record<string, string> = {}

    marks.forEach((mark) => {
      if (
        String(mark.examId) === String(selectedExam) &&
        classStudents.some(
          (student) =>
            String(student.id) ===
            String(mark.studentId)
        )
      ) {
        existing[
          scoreKey(
            String(mark.studentId),
            String(mark.subjectId)
          )
        ] = String(mark.score)
      }
    })

    setScores(existing)
  }, [
    selectedClass,
    selectedExam,
    marks,
    classStudents,
  ])

  /*
   * Update a single mark cell.
   */
  function updateScore(
    studentId: string,
    subjectId: string,
    value: string
  ) {
    if (value === '') {
      setScores((current) => ({
        ...current,
        [scoreKey(studentId, subjectId)]: '',
      }))

      return
    }

    const number = Number(value)

    if (Number.isNaN(number)) {
      return
    }

    const limited = Math.max(
      0,
      Math.min(100, number)
    )

    setScores((current) => ({
      ...current,
      [scoreKey(studentId, subjectId)]:
        String(limited),
    }))
  }

  /*
   * Save every entered mark on the current class sheet.
   */
  async function saveMarks() {
    if (!selectedClass) {
      setMessage('Please select a class.')
      return
    }

    if (!selectedExam) {
      setMessage('Please select an exam.')
      return
    }

    if (classStudents.length === 0) {
      setMessage('No students found in this class.')
      return
    }

    if (classSubjects.length === 0) {
      setMessage(
        'No subjects or learning areas found for this class.'
      )
      return
    }

    const entries: {
      studentId: string
      subjectId: string
      score: number
    }[] = []

    classStudents.forEach((student) => {
      classSubjects.forEach((subject) => {
        const value =
          scores[
            scoreKey(
              String(student.id),
              String(subject.id)
            )
          ]

        if (
          value !== undefined &&
          value !== ''
        ) {
          const score = Number(value)

          if (
            !Number.isNaN(score) &&
            score >= 0 &&
            score <= 100
          ) {
            entries.push({
              studentId: String(student.id),
              subjectId: String(subject.id),
              score,
            })
          }
        }
      })
    })

    if (entries.length === 0) {
      setMessage(
        'Enter at least one mark before saving.'
      )
      return
    }

    try {
      setSaving(true)
      setMessage('')

      const response = await fetch('/api/marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId: selectedExam,
          entries,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to save marks.'
        )
      }

      setMessage('Marks saved successfully.')

      await loadData()
    } catch (error) {
      console.error(error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to save marks.'
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * Download ONLY the selected class.
   *
   * The downloaded CSV contains:
   * Admission Number
   * Student Name
   * Stream
   * Each subject/learning area
   *
   * It does NOT contain guardian information.
   */
  function downloadClassMarks() {
    if (!selectedClass) {
      setMessage('Please select a class first.')
      return
    }

    if (classStudents.length === 0) {
      setMessage('There are no students in this class.')
      return
    }

    if (classSubjects.length === 0) {
      setMessage(
        'There are no subjects or learning areas for this class.'
      )
      return
    }

    const selectedExamObject = exams.find(
      (exam) =>
        String(exam.id) === String(selectedExam)
    )

    const headers = [
      'No.',
      'Admission Number',
      'Student Name',
      'Stream',
      ...classSubjects.map(
        (subject) =>
          `${subject.name} (${subject.code})`
      ),
    ]

    const rows = classStudents.map(
      (student, index) => {
        return [
          index + 1,
          student.admissionNo,
          `${student.firstName} ${student.lastName}`.trim(),
          student.stream || '',
          ...classSubjects.map((subject) => {
            const value =
              scores[
                scoreKey(
                  String(student.id),
                  String(subject.id)
                )
              ]

            return value ?? ''
          }),
        ]
      }
    )

    function csvEscape(value: unknown) {
      const text = String(value ?? '')

      return `"${text.replace(/"/g, '""')}"`
    }

    const csv = [
      headers.map(csvEscape).join(','),
      ...rows.map((row) =>
        row.map(csvEscape).join(',')
      ),
    ].join('\n')

    /*
     * UTF-8 BOM helps Excel open the CSV correctly.
     */
    const blob = new Blob(
      ['\uFEFF' + csv],
      {
        type: 'text/csv;charset=utf-8;',
      }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    const examName =
      selectedExamObject?.name || 'Marks'

    const safeClass = selectedClass.replace(
      /[^a-z0-9]+/gi,
      '_'
    )

    const safeExam = examName.replace(
      /[^a-z0-9]+/gi,
      '_'
    )

    link.download =
      `${safeClass}_${safeExam}_Marks_List.csv`

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    setMessage(
      `${selectedClass} marks list downloaded successfully.`
    )
  }

  const selectedExamObject = exams.find(
    (exam) =>
      String(exam.id) === String(selectedExam)
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marks Entry"
        description="Select a class and exam to enter marks by learning area."
      />

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Loading students, subjects, exams and marks...
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Class Marks List
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Class
                  </label>

                  <select
                    value={selectedClass}
                    onChange={(event) => {
                      setSelectedClass(
                        event.target.value
                      )
                      setScores({})
                      setMessage('')
                    }}
                    className="w-full rounded-md border bg-background p-2"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((className) => (
                      <option
                        key={className}
                        value={className}
                      >
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Exam
                  </label>

                  <select
                    value={selectedExam}
                    onChange={(event) => {
                      setSelectedExam(
                        event.target.value
                      )
                      setMessage('')
                    }}
                    className="w-full rounded-md border bg-background p-2"
                  >
                    <option value="">
                      Select exam
                    </option>

                    {exams.map((exam) => (
                      <option
                        key={exam.id}
                        value={exam.id}
                      >
                        {exam.name} - {exam.term}{' '}
                        {exam.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={loadData}
                    disabled={loading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>

                  <Button
                    variant="outline"
                    onClick={
                      downloadClassMarks
                    }
                    disabled={
                      !selectedClass ||
                      classStudents.length === 0
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Class List
                  </Button>
                </div>
              </div>

              {selectedClass && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Selected Class
                    </p>

                    <p className="font-semibold">
                      {selectedClass}
                    </p>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Students
                    </p>

                    <p className="font-semibold">
                      {classStudents.length}
                    </p>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Learning Areas
                    </p>

                    <p className="font-semibold">
                      {classSubjects.length}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedClass &&
            selectedExam && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedClass} —{' '}
                    {selectedExamObject?.name ||
                      'Selected Exam'}
                  </CardTitle>

                  <p className="text-sm text-muted-foreground">
                    Enter marks out of 100 for each
                    learning area.
                  </p>
                </CardHeader>

                <CardContent>
                  {classStudents.length === 0 ? (
                    <div className="rounded-md border p-8 text-center">
                      <p className="font-medium">
                        No students found.
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        There are no active students
                        registered in{' '}
                        {selectedClass}.
                      </p>
                    </div>
                  ) : classSubjects.length === 0 ? (
                    <div className="rounded-md border p-8 text-center">
                      <p className="font-medium">
                        No learning areas found.
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Add subjects for this class
                        category before entering marks.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="min-w-max w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="sticky left-0 z-20 min-w-12 border-r bg-muted/50 p-3 text-left">
                                #
                              </th>

                              <th className="sticky left-12 z-20 min-w-36 border-r bg-muted/50 p-3 text-left">
                                Admission No.
                              </th>

                              <th className="sticky left-[9rem] z-20 min-w-56 border-r bg-muted/50 p-3 text-left">
                                Student Name
                              </th>

                              <th className="min-w-28 border-r p-3 text-left">
                                Stream
                              </th>

                              {classSubjects.map(
                                (subject) => (
                                  <th
                                    key={
                                      subject.id
                                    }
                                    className="min-w-36 border-r p-3 text-center"
                                  >
                                    <div className="font-semibold">
                                      {
                                        subject.name
                                      }
                                    </div>

                                    <div className="text-xs font-normal text-muted-foreground">
                                      {
                                        subject.code
                                      }
                                    </div>
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>

                          <tbody>
                            {classStudents.map(
                              (
                                student,
                                index
                              ) => (
                                <tr
                                  key={student.id}
                                  className="border-b last:border-0"
                                >
                                  <td className="sticky left-0 z-10 border-r bg-background p-3">
                                    {index + 1}
                                  </td>

                                  <td className="sticky left-12 z-10 border-r bg-background p-3 font-mono text-xs">
                                    {
                                      student.admissionNo
                                    }
                                  </td>

                                  <td className="sticky left-[9rem] z-10 border-r bg-background p-3 font-medium">
                                    {
                                      student.firstName
                                    }{' '}
                                    {
                                      student.lastName
                                    }
                                  </td>

                                  <td className="border-r p-3 text-muted-foreground">
                                    {student.stream ||
                                      '—'}
                                  </td>

                                  {classSubjects.map(
                                    (
                                      subject
                                    ) => {
                                      const key =
                                        scoreKey(
                                          String(
                                            student.id
                                          ),
                                          String(
                                            subject.id
                                          )
                                        )

                                      return (
                                        <td
                                          key={
                                            subject.id
                                          }
                                          className="border-r p-2 text-center"
                                        >
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={
                                              scores[
                                                key
                                              ] ??
                                              ''
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              updateScore(
                                                String(
                                                  student.id
                                                ),
                                                String(
                                                  subject.id
                                                ),
                                                event
                                                  .target
                                                  .value
                                              )
                                            }
                                            className="h-9 w-24 rounded-md border bg-background px-2 text-center outline-none focus:ring-2 focus:ring-ring"
                                            aria-label={`${subject.name} mark for ${student.firstName} ${student.lastName}`}
                                          />
                                        </td>
                                      )
                                    }
                                  )}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                        {auth?.role ===
                          'admin' && (
                          <Button
                            onClick={
                              saveMarks
                            }
                            disabled={saving}
                          >
                            {saving
                              ? 'Saving...'
                              : 'Save All Marks'}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={
                            downloadClassMarks
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download{' '}
                          {selectedClass}{' '}
                          Class List
                        </Button>

                        {message && (
                          <p className="text-sm text-muted-foreground">
                            {message}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
        </>
      )}
    </div>
  )
}

