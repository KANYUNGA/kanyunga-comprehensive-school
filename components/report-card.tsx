'use client'

import { useMemo } from 'react'
import { useSchool } from '@/lib/store'
import { studentName } from '@/lib/data'

type ReportCardProps = {
studentId: string
examId: string
}

function performanceLevel(score: number) {
if (score >= 76) return 'AL8'
if (score >= 71) return 'AL7'
if (score >= 61) return 'AL6'
if (score >= 51) return 'AL5'
if (score >= 41) return 'AL4'
if (score >= 31) return 'AL3'
if (score >= 21) return 'AL2'
return 'AL1'
}

function performanceDescription(score: number) {
if (score >= 76) return 'Exceeding Expectations'
if (score >= 61) return 'Meeting Expectations'
if (score >= 41) return 'Approaching Expectations'
return 'Below Expectations'
}

export function ReportCard({
studentId,
examId,
}: ReportCardProps) {
const { data } = useSchool()

const student = data.students.find(
(item) => item.id === studentId,
)

const exam = data.exams.find(
(item) => item.id === examId,
)

const schoolClass = data.classes.find(
(item) => item.id === student?.classId,
)

const marks = useMemo(() => {
return data.marks
.filter(
(mark) =>
mark.studentId === studentId &&
mark.examId === examId,
)
.map((mark) => {
const subject = data.subjects.find(
(item) => item.id === mark.subjectId,
)

    return {
      ...mark,
      subjectName: subject?.name ?? 'Unknown Subject',
      score: Number(mark.score ?? 0),
    }
  })
  .sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName),
  )

}, [data.marks, data.subjects, studentId, examId])

const total = marks.reduce(
(sum, mark) => sum + mark.score,
0,
)

const mean =
marks.length > 0
? total / marks.length
: 0

const position = useMemo(() => {
if (!student) return null

const classStudents = data.students.filter(
  (item) =>
    item.classId === student.classId &&
    item.status === 'Active',
)

const totals = classStudents
  .map((classStudent) => {
    const studentMarks = data.marks.filter(
      (mark) =>
        mark.studentId === classStudent.id &&
        mark.examId === examId,
    )

    return {
      studentId: classStudent.id,
      total: studentMarks.reduce(
        (sum, mark) =>
          sum + Number(mark.score ?? 0),
        0,
      ),
    }
  })
  .filter((item) => item.total > 0)
  .sort((a, b) => b.total - a.total)

const index = totals.findIndex(
  (item) => item.studentId === studentId,
)

if (index === -1) return null

return `${index + 1} / ${totals.length}`

}, [
data.students,
data.marks,
student,
examId,
studentId,
])

if (!student || !exam) {
return ( <div className="rounded-lg border p-6 text-center">
Student or examination not found. </div>
)
}

return ( <div className="mx-auto w-full max-w-4xl rounded-lg border bg-background p-6 print:border-0 print:shadow-none"> <div className="mb-6 text-center"> <h1 className="text-2xl font-bold">
KANYUNGA COMPREHENSIVE SCHOOL </h1>

    <p className="mt-1 text-sm">
      Student Academic Report
    </p>

    <p className="mt-2 font-semibold">
      {exam.name} — {exam.term} {exam.year}
    </p>
  </div>

  <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
    <div>
      <strong>Student:</strong>{' '}
      {studentName(student)}
    </div>

    <div>
      <strong>Admission No:</strong>{' '}
      {student.admissionNo}
    </div>

    <div>
      <strong>Class:</strong>{' '}
      {schoolClass?.name ?? student.classId}
    </div>

    <div>
      <strong>Stream:</strong>{' '}
      {student.stream || '—'}
    </div>

    <div>
      <strong>Gender:</strong>{' '}
      {student.gender}
    </div>

    <div>
      <strong>Position:</strong>{' '}
      {position ?? '—'}
    </div>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full border-collapse border">
      <thead>
        <tr>
          <th className="border p-2 text-left">
            No.
          </th>

          <th className="border p-2 text-left">
            Learning Area / Subject
          </th>

          <th className="border p-2 text-center">
            Score
          </th>

          <th className="border p-2 text-center">
            Achievement Level
          </th>

          <th className="border p-2 text-left">
            Descriptor
          </th>
        </tr>
      </thead>

      <tbody>
        {marks.length > 0 ? (
          marks.map((mark, index) => (
            <tr key={mark.id}>
              <td className="border p-2">
                {index + 1}
              </td>

              <td className="border p-2">
                {mark.subjectName}
              </td>

              <td className="border p-2 text-center">
                {mark.score}
              </td>

              <td className="border p-2 text-center font-semibold">
                {performanceLevel(mark.score)}
              </td>

              <td className="border p-2">
                {performanceDescription(mark.score)}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={5}
              className="border p-6 text-center"
            >
              No marks have been entered for this
              examination.
            </td>
          </tr>
        )}
      </tbody>

      <tfoot>
        <tr className="font-semibold">
          <td
            colSpan={2}
            className="border p-2 text-right"
          >
            Total
          </td>

          <td className="border p-2 text-center">
            {total}
          </td>

          <td
            colSpan={2}
            className="border p-2"
          >
            Mean Score:{' '}
            {mean.toFixed(2)}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        Total Marks
      </p>
      <p className="text-xl font-bold">
        {total}
      </p>
    </div>

    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        Mean Score
      </p>
      <p className="text-xl font-bold">
        {mean.toFixed(2)}
      </p>
    </div>

    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        Overall Level
      </p>
      <p className="text-xl font-bold">
        {marks.length > 0
          ? performanceLevel(mean)
          : '—'}
      </p>
    </div>
  </div>

  <div className="mt-10 grid grid-cols-2 gap-10 text-center">
    <div>
      <div className="border-b" />
      <p className="mt-2 text-sm">
        Class Teacher
      </p>
    </div>

    <div>
      <div className="border-b" />
      <p className="mt-2 text-sm">
        Head of Institution
      </p>
    </div>
  </div>
</div>

)
                      }
      
