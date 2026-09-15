'use client'

import { useMemo } from 'react'
import { useSchool } from '@/lib/store'
import { studentName } from '@/lib/data'

type ReportCardProps = {
studentId: string
examId: string
  studentId: string
  examId: string
}

type StudentWithPhoto = {
  id: string
  admissionNo?: string
  firstName?: string
  middleName?: string
  lastName?: string
  gender?: string
  classId?: string
  stream?: string
  status?: string
  photoUrl?: string
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
  if (score >= 76) return 'Exceeding Expectations'
  if (score >= 61) return 'Meeting Expectations'
  if (score >= 41) return 'Approaching Expectations'
  return 'Below Expectations'
}

function safeString(value: unknown) {
  return String(value ?? '').trim()
}

export function ReportCard({
studentId,
examId,
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
  const { data } = useSchool()

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
  const students = Array.isArray(data.students)
    ? data.students
    : []

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
  const classes = Array.isArray(data.classes)
    ? data.classes
    : []

return ( <div className="mx-auto w-full max-w-4xl rounded-lg border bg-background p-6 print:border-0 print:shadow-none"> <div className="mb-6 text-center"> <h1 className="text-2xl font-bold">
KANYUNGA COMPREHENSIVE SCHOOL </h1>
  const exams = Array.isArray(data.exams)
    ? data.exams
    : []

    <p className="mt-1 text-sm">
      Student Academic Report
    </p>
  const subjects = Array.isArray(data.subjects)
    ? data.subjects
    : []

    <p className="mt-2 font-semibold">
      {exam.name} — {exam.term} {exam.year}
    </p>
  </div>
  const allMarks = Array.isArray(data.marks)
    ? data.marks
    : []

  <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
    <div>
      <strong>Student:</strong>{' '}
      {studentName(student)}
    </div>
  const student = students.find(
    (item) => String(item.id) === String(studentId),
  ) as StudentWithPhoto | undefined

    <div>
      <strong>Admission No:</strong>{' '}
      {student.admissionNo}
    </div>
  const exam = exams.find(
    (item) => String(item.id) === String(examId),
  )

    <div>
      <strong>Class:</strong>{' '}
      {schoolClass?.name ?? student.classId}
    </div>
  const schoolClass = classes.find(
    (item) =>
      String(item.id) === String(student?.classId),
  )

    <div>
      <strong>Stream:</strong>{' '}
      {student.stream || '—'}
    </div>
  const marks = useMemo(() => {
    return allMarks
      .filter(
        (mark) =>
          String(mark.studentId) === String(studentId) &&
          String(mark.examId) === String(examId),
      )
      .map((mark) => {
        const subject = subjects.find(
          (item) =>
            String(item.id) === String(mark.subjectId),
        )

        return {
          ...mark,
          subjectName:
            subject?.name ?? 'Unknown Subject',
          score: Number(mark.score ?? 0),
        }
      })
      .sort((a, b) =>
        a.subjectName.localeCompare(b.subjectName),
      )
  }, [
    allMarks,
    subjects,
    studentId,
    examId,
  ])

  const total = marks.reduce(
    (sum, mark) => sum + mark.score,
    0,
  )

    <div>
      <strong>Gender:</strong>{' '}
      {student.gender}
    </div>
  const mean =
    marks.length > 0
      ? total / marks.length
      : 0

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
  const position = useMemo(() => {
    if (!student) return null

              <td className="border p-2">
                {mark.subjectName}
              </td>
    const classStudents = students.filter(
      (item) =>
        String(item.classId) ===
          String(student.classId) &&
        item.status === 'Active',
    )

              <td className="border p-2 text-center">
                {mark.score}
    const totals = classStudents
      .map((classStudent) => {
        const studentMarks = allMarks.filter(
          (mark) =>
            String(mark.studentId) ===
              String(classStudent.id) &&
            String(mark.examId) === String(examId),
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
      (item) =>
        String(item.studentId) === String(studentId),
    )

    if (index === -1) return null

    return `${index + 1} / ${totals.length}`
  }, [
    students,
    allMarks,
    student,
    examId,
    studentId,
  ])

  if (!student || !exam) {
    return (
      <div className="rounded-lg border p-6 text-center">
        Student or examination not found.
      </div>
    )
  }

  const photoUrl = safeString(student.photoUrl)

  const className =
    safeString(schoolClass?.name) ||
    safeString(student.classId) ||
    '—'

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-4xl
        rounded-lg
        border
        bg-white
        p-6
        text-black
        shadow-sm
        print:max-w-none
        print:rounded-none
        print:border
        print:p-6
        print:shadow-none
      "
    >
      {/* SCHOOL HEADER */}
      <div className="mb-5 border-b-2 pb-4 text-center">
        <h1 className="text-2xl font-bold tracking-wide">
          KANYUNGA COMPREHENSIVE SCHOOL
        </h1>

        <p className="mt-1 text-lg font-semibold">
          STUDENT ACADEMIC REPORT
        </p>

        <p className="mt-1 text-sm font-medium">
          {safeString(exam.name)}
          {' — '}
          {safeString(exam.term)} {safeString(exam.year)}
        </p>
      </div>

      {/* STUDENT INFORMATION */}
      <div className="mb-6 grid grid-cols-[120px_1fr] gap-5 rounded-lg border p-4">
        {/* PASSPORT PHOTO */}
        <div className="flex items-start justify-center">
          <div
            className="
              flex
              h-[125px]
              w-[100px]
              items-center
              justify-center
              overflow-hidden
              rounded-md
              border-2
              border-gray-400
              bg-gray-50
            "
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${studentName(student)} passport photo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="px-2 text-center text-xs text-gray-500">
                Passport
                <br />
                Photo
              </div>
            )}
          </div>
        </div>

        {/* DETAILS */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          <div>
            <span className="font-semibold">
              Student:
            </span>{' '}
            {studentName(student)}
          </div>

          <div>
            <span className="font-semibold">
              Admission No:
            </span>{' '}
            {safeString(student.admissionNo) || '—'}
          </div>

          <div>
            <span className="font-semibold">
              Class:
            </span>{' '}
            {className}
          </div>

          <div>
            <span className="font-semibold">
              Stream:
            </span>{' '}
            {safeString(student.stream) || '—'}
          </div>

          <div>
            <span className="font-semibold">
              Gender:
            </span>{' '}
            {safeString(student.gender) || '—'}
          </div>

          <div>
            <span className="font-semibold">
              Position:
            </span>{' '}
            {position ?? '—'}
          </div>
        </div>
      </div>

      {/* ACADEMIC RESULTS */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center">
                No.
              </th>

              <th className="border border-black p-2 text-left">
                Learning Area / Subject
              </th>

              <th className="border border-black p-2 text-center">
                Score
              </th>

              <th className="border border-black p-2 text-center">
                Achievement Level
              </th>

              <th className="border border-black p-2 text-left">
                Descriptor
              </th>
            </tr>
          </thead>

          <tbody>
            {marks.length > 0 ? (
              marks.map((mark, index) => (
                <tr key={String(mark.id)}>
                  <td className="border border-black p-2 text-center">
                    {index + 1}
                  </td>

                  <td className="border border-black p-2">
                    {mark.subjectName}
                  </td>

                  <td className="border border-black p-2 text-center font-semibold">
                    {mark.score}
                  </td>

                  <td className="border border-black p-2 text-center font-semibold">
                    {performanceLevel(mark.score)}
                  </td>

                  <td className="border border-black p-2">
                    {performanceDescription(mark.score)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="border border-black p-6 text-center"
                >
                  No marks have been entered for this
                  examination.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr className="font-bold">
              <td
                colSpan={2}
                className="border border-black p-2 text-right"
              >
                Total Marks
              </td>

              <td className="border p-2 text-center font-semibold">
                {performanceLevel(mark.score)}
              <td className="border border-black p-2 text-center">
                {total}
              </td>

              <td className="border p-2">
                {performanceDescription(mark.score)}
              <td
                colSpan={2}
                className="border border-black p-2"
              >
                Mean Score: {mean.toFixed(2)}
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
          </tfoot>
        </table>
      </div>

      {/* SUMMARY */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-md border p-3 text-center">
          <p className="text-xs font-medium uppercase">
            Total Marks
          </p>

          <p className="mt-1 text-lg font-bold">
            {total}
          </td>
          </p>
        </div>

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
        <div className="rounded-md border p-3 text-center">
          <p className="text-xs font-medium uppercase">
            Mean Score
          </p>

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
          <p className="mt-1 text-lg font-bold">
            {mean.toFixed(2)}
          </p>
        </div>

        <div className="rounded-md border p-3 text-center">
          <p className="text-xs font-medium uppercase">
            Overall Level
          </p>

          <p className="mt-1 text-lg font-bold">
            {marks.length > 0
              ? performanceLevel(mean)
              : '—'}
          </p>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="mt-12 grid grid-cols-2 gap-16 text-center">
        <div>
          <div className="border-b border-black" />

          <p className="mt-2 text-sm font-medium">
            Class Teacher
          </p>
        </div>

        <div>
          <div className="border-b border-black" />

          <p className="mt-2 text-sm font-medium">
            Head of Institution
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

)
                      }
      
  )
}
