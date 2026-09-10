
'use client'

import { useEffect, useMemo, useState } from 'react'
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

const TERMS = ['Term 1', 'Term 2', 'Term 3']

export default function ReportsPage() {
  const { data } = useSchool()

  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [term, setTerm] = useState('Term 1')
  const [examId, setExamId] = useState('')

  /*
   * Classes are loaded from the database by the SchoolProvider.
   * Once they arrive, automatically select the first class.
   */
  useEffect(() => {
    if (!classId && data.classes.length > 0) {
      setClassId(data.classes[0].id)
    }
  }, [data.classes, classId])

  /*
   * Students belonging to the selected class.
   */
  const roster = useMemo(() => {
    if (!classId) return []

    return data.students.filter(
      (student) =>
        student.classId === classId &&
        student.status === 'Active',
    )
  }, [data.students, classId])

  /*
   * When the class changes, automatically select the
   * first active student in that class.
   */
  useEffect(() => {
    if (roster.length === 0) {
      setStudentId('')
      return
    }

    const studentStillExists = roster.some(
      (student) => student.id === studentId,
    )

    if (!studentStillExists) {
      setStudentId(roster[0].id)
    }
  }, [roster, studentId])

  /*
   * Exams belonging to the selected term and year.
   *
   * This supports:
   * - one exam in a term
   * - several exams in a term
   * - no exam yet in a term
   */
  const termExams = useMemo(() => {
    return data.exams
      .filter(
        (exam) =>
          exam.term === term &&
          exam.year === data.school.currentYear,
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data.exams, data.school.currentYear, term])

  /*
   * When the term changes, select the first available exam.
   * If there is only one exam, it is automatically selected.
   */
  useEffect(() => {
    if (termExams.length === 0) {
      setExamId('')
      return
    }

    const selectedExamStillExists = termExams.some(
      (exam) => exam.id === examId,
    )

    if (!selectedExamStillExists) {
      setExamId(termExams[0].id)
    }
  }, [termExams, examId])

  const activeStudentId = roster.some(
    (student) => student.id === studentId,
  )
    ? studentId
    : roster[0]?.id ?? ''

  const selectedExam = termExams.find(
    (exam) => exam.id === examId,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Report Forms"
        description="Generate end-of-term report cards with automatic grading."
        actions={
          <Button
            onClick={() => window.print()}
            className="print:hidden"
            disabled={!activeStudentId || !selectedExam}
          >
            <Printer className="size-4" />
            Print
          </Button>
        }
      />

      <Card className="print:hidden">
        <CardContent className="flex flex-wrap gap-4 pt-6">
          {/* CLASS */}
          <div className="flex flex-col gap-2">
            <Label>Class</Label>

            <Select
              value={classId}
              onValueChange={(value) => {
                setClassId(value)
                setStudentId('')
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>

              <SelectContent>
                {data.classes.length > 0 ? (
                  data.classes.map((cls) => (
                    <SelectItem
                      key={cls.id}
                      value={cls.id}
                    >
                      {cls.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-classes" disabled>
                    No classes available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* STUDENT */}
          <div className="flex flex-col gap-2">
            <Label>Student</Label>

            <Select
              value={activeStudentId}
              onValueChange={(value) => setStudentId(value)}
              disabled={roster.length === 0}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>

              <SelectContent>
                {roster.map((student) => (
                  <SelectItem
                    key={student.id}
                    value={student.id}
                  >
                    {studentName(student)} · {student.admissionNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TERM */}
          <div className="flex flex-col gap-2">
            <Label>Term</Label>

            <Select
              value={term}
              onValueChange={(value) => {
                setTerm(value)
                setExamId('')
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>

              <SelectContent>
                {TERMS.map((termName) => (
                  <SelectItem
                    key={termName}
                    value={termName}
                  >
                    {termName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* EXAM */}
          <div className="flex flex-col gap-2">
            <Label>Exam</Label>

            <Select
              value={examId}
              onValueChange={(value) => setExamId(value)}
              disabled={termExams.length === 0}
            >
              <SelectTrigger className="w-56">
                <SelectValue
                  placeholder={
                    termExams.length === 0
                      ? 'No exam available'
                      : 'Select exam'
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {termExams.map((exam) => (
                  <SelectItem
                    key={exam.id}
                    value={exam.id}
                  >
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* NO CLASS */}
      {data.classes.length === 0 && (
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No classes have been added yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* NO STUDENTS */}
      {classId && roster.length === 0 && (
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No active students found in this class.
            </p>
          </CardContent>
        </Card>
      )}

      {/* NO EXAM */}
      {classId &&
        roster.length > 0 &&
        termExams.length === 0 && (
          <Card className="print:hidden">
            <CardContent className="pt-6">
              <p className="font-medium">
                No {term} exam has been added yet.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Add an exam for {term} in the Examination section,
                then enter the students&apos; marks.
              </p>
            </CardContent>
          </Card>
        )}

      {/* REPORT */}
      {activeStudentId && selectedExam ? (
        <ReportCard
          studentId={activeStudentId}
          examId={selectedExam.id}
        />
      ) : null}
    </div>
  )
}
