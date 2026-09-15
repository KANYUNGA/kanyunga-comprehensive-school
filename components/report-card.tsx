
'use client'

import { useMemo } from 'react'
import { useSchool } from '@/lib/store'
import { studentName } from '@/lib/data'

type ReportCardProps = {
  studentId: string
  examId: string
}

function safeString(value: unknown): string {
  return String(value ?? '').trim()
}

function getAchievementLevel(score: number): string {
  if (score >= 80) return 'AL4'
  if (score >= 60) return 'AL3'
  if (score >= 40) return 'AL2'
  return 'AL1'
}

function getDescriptor(score: number): string {
  if (score >= 80) return 'Exceeds Expectations'
  if (score >= 60) return 'Meets Expectations'
  if (score >= 40) return 'Approaches Expectations'
  return 'Below Expectations'
}

export function ReportCard({
  studentId,
  examId,
}: ReportCardProps) {
  const { data } = useSchool()

  const students = Array.isArray(data?.students) ? data.students : []
  const classes = Array.isArray(data?.classes) ? data.classes : []
  const exams = Array.isArray(data?.exams) ? data.exams : []
  const marks = Array.isArray(data?.marks) ? data.marks : []

  const student = useMemo(
    () =>
      students.find(
        (item) => String(item.id) === String(studentId),
      ),
    [students, studentId],
  )

  const exam = useMemo(
    () =>
      exams.find(
        (item) => String(item.id) === String(examId),
      ),
    [exams, examId],
  )

  const classInfo = useMemo(() => {
    if (!student) return undefined

    return classes.find(
      (item) =>
        String(item.id) === String(student.classId) ||
        safeString(item.name).toLowerCase() ===
          safeString(student.classId).toLowerCase(),
    )
  }, [classes, student])

  if (!student) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Student not found.
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Exam not found.
      </div>
    )
  }

  const photoUrl = safeString(
    (student as typeof student & { photoUrl?: string }).photoUrl,
  )

  const studentMarks = marks.filter((mark: any) => {
    const markStudentId =
      mark.studentId ??
      mark.student_id

    const markExamId =
      mark.examId ??
      mark.exam_id

    return (
      String(markStudentId) === String(student.id) &&
      String(markExamId) === String(exam.id)
    )
  })

  const reportRows = studentMarks.map(
    (mark: any, index: number) => {
      const rawScore =
        mark.score ??
        mark.marks ??
        mark.mark ??
        0

      const score = Number(rawScore) || 0

      const subjectName =
        mark.subjectName ??
        mark.subject_name ??
        mark.subject ??
        'Learning Area'

      const learningArea =
        mark.learningArea ??
        mark.learning_area ??
        mark.learningAreaName ??
        subjectName

      return {
        number: index + 1,
        learningArea: safeString(learningArea),
        subject: safeString(subjectName),
        score,
        achievementLevel: getAchievementLevel(score),
        descriptor: getDescriptor(score),
      }
    },
  )

  const totalMarks = reportRows.reduce(
    (total, row) => total + row.score,
    0,
  )

  const meanScore =
    reportRows.length > 0
      ? totalMarks / reportRows.length
      : 0

  const displayClass =
    safeString(classInfo?.name) ||
    safeString(student.classId) ||
    '—'

  const displayStream =
    safeString(student.stream) || '—'

  const displayGender =
    safeString(student.gender) || '—'

  const displayAdmission =
    safeString(student.admissionNo) || '—'

  const displayName =
    safeString(studentName(student)) || '—'

  const displayExamName =
    safeString(exam.name) || 'Examination'

  const displayTerm =
    safeString(exam.term) || 'Term 1'

  const displayYear =
    safeString(exam.year) || '2026'

  return (
    <>
      <div
        className="
          mx-auto
          w-full
          max-w-5xl
          rounded-lg
          border
          bg-white
          p-6
          text-black
          shadow-sm
          print:max-w-none
          print:rounded-none
          print:border-0
          print:p-0
          print:shadow-none
        "
      >
        {/* SCHOOL HEADER */}
        <div className="mb-6 border-b-2 border-gray-800 pb-5 text-center">
          {/* SCHOOL LOGO */}
          <div className="mb-3 flex justify-center">
            <img
              src="/school-logo.jpg"
              alt="Kanyunga Comprehensive School Logo"
              className="h-24 w-24 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold tracking-wide">
            KANYUNGA COMPREHENSIVE SCHOOL
          </h1>

          <p className="mt-1 text-lg font-semibold">
            STUDENT ACADEMIC REPORT
          </p>

          <p className="mt-1 text-sm font-medium">
            {displayExamName}
            {' — '}
            {displayTerm} {displayYear}
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
                  alt={`${displayName} passport photo`}
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

          {/* STUDENT DETAILS */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            <div>
              <span className="font-semibold">
                Student:
              </span>{' '}
              {displayName}
            </div>

            <div>
              <span className="font-semibold">
                Admission No:
              </span>{' '}
              {displayAdmission}
            </div>

            <div>
              <span className="font-semibold">
                Class:
              </span>{' '}
              {displayClass}
            </div>

            <div>
              <span className="font-semibold">
                Stream:
              </span>{' '}
              {displayStream}
            </div>

            <div>
              <span className="font-semibold">
                Gender:
              </span>{' '}
              {displayGender}
            </div>

            <div>
              <span className="font-semibold">
                Position:
              </span>{' '}
              —
            </div>
          </div>
        </div>

        {/* ACADEMIC PERFORMANCE */}
        <div className="mb-6 overflow-hidden rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="border-r px-3 py-3 text-center font-bold">
                  No.
                </th>

                <th className="border-r px-3 py-3 text-left font-bold">
                  Learning Area
                </th>

                <th className="border-r px-3 py-3 text-left font-bold">
                  Subject
                </th>

                <th className="border-r px-3 py-3 text-center font-bold">
                  Score
                </th>

                <th className="border-r px-3 py-3 text-center font-bold">
                  Achievement Level
                </th>

                <th className="px-3 py-3 text-left font-bold">
                  Descriptor
                </th>
              </tr>
            </thead>

            <tbody>
              {reportRows.length > 0 ? (
                reportRows.map((row) => (
                  <tr
                    key={`${row.number}-${row.subject}`}
                    className="border-b last:border-b-0"
                  >
                    <td className="border-r px-3 py-3 text-center">
                      {row.number}
                    </td>

                    <td className="border-r px-3 py-3">
                      {row.learningArea}
                    </td>

                    <td className="border-r px-3 py-3">
                      {row.subject}
                    </td>

                    <td className="border-r px-3 py-3 text-center font-semibold">
                      {row.score}
                    </td>

                    <td className="border-r px-3 py-3 text-center font-semibold">
                      {row.achievementLevel}
                    </td>

                    <td className="px-3 py-3">
                      {row.descriptor}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No marks have been recorded for this
                    student and examination.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SUMMARY */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold text-gray-600">
              Total Marks
            </p>

            <p className="mt-1 text-2xl font-bold">
              {totalMarks}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold text-gray-600">
              Mean Score
            </p>

            <p className="mt-1 text-2xl font-bold">
              {meanScore.toFixed(2)}
            </p>
          </div>
        </div>

        {/* REPORT FOOTER */}
        <div className="mt-8 grid grid-cols-1 gap-8 border-t pt-6 sm:grid-cols-2">
          <div>
            <p className="mb-8 font-semibold">
              Class Teacher's Signature
            </p>

            <div className="border-b border-gray-500" />

            <p className="mt-1 text-xs text-gray-500">
              Signature
            </p>
          </div>

          <div>
            <p className="mb-8 font-semibold">
              Head Teacher's Signature
            </p>

            <div className="border-b border-gray-500" />

            <p className="mt-1 text-xs text-gray-500">
              Signature
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          KANYUNGA COMPREHENSIVE SCHOOL
          {' • '}
          Student Academic Report
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: visible !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </>
  )
}

