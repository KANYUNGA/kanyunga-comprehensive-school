"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useSchool } from "@/lib/store"

type Student = {
  id: string
  admissionNo: string
  firstName: string
  middleName?: string
  lastName?: string
  gender?: string
  className?: string
  stream?: string
}

type Subject = {
  id: string
  code?: string
  name: string
}

type Exam = {
  id: string
  name: string
  term?: string
  year?: number
  className?: string
}

type Mark = {
  id?: string
  studentId: string
  subjectId: string
  examId: string
  score: number
}

type Assignment = {
  assignment_id: string
  teacher_id: string
  subject_id: string
  subject_name: string
  subject_code?: string
  class_id: string
  class_name: string
}

function normalizeClassName(value: string) {
  const v = String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "")

  if (v === "playgroup" || v === "play") return "playgroup"

  if (
    v === "pp1" ||
    v === "preprimary1" ||
    v === "preprimaryone"
  ) {
    return "pp1"
  }

  if (
    v === "pp2" ||
    v === "preprimary2" ||
    v === "preprimarytwo"
  ) {
    return "pp2"
  }

  return v
}

function getStudentName(student: Student) {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ")
}

export default function MarksPage() {
  const { role } = useSchool()

  const normalizedRole = String(role ?? "").toLowerCase()

  const isAdmin = normalizedRole === "admin"
  const isTeacher = normalizedRole === "teacher"

  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")

  const [scores, setScores] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("")

  async function loadData() {
    try {
      setLoading(true)
      setMessage("")

      const [
        studentsResponse,
        subjectsResponse,
        examsResponse,
        marksResponse,
        assignmentsResponse,
      ] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/subjects"),
        fetch("/api/exams"),
        fetch("/api/marks"),
        fetch("/api/teacher-subject-assignments"),
      ])

      if (!studentsResponse.ok) {
        throw new Error("Failed to load students")
      }

      if (!subjectsResponse.ok) {
        throw new Error("Failed to load subjects")
      }

      if (!examsResponse.ok) {
        throw new Error("Failed to load exams")
      }

      if (!marksResponse.ok) {
        throw new Error("Failed to load marks")
      }

      if (!assignmentsResponse.ok) {
        throw new Error("Failed to load teacher assignments")
      }

      const studentsResult = await studentsResponse.json()
      const subjectsResult = await subjectsResponse.json()
      const examsResult = await examsResponse.json()
      const marksResult = await marksResponse.json()
      const assignmentsResult = await assignmentsResponse.json()

      const studentData =
        studentsResult.data ?? studentsResult.students ?? []

      const subjectData =
        subjectsResult.data ?? subjectsResult.subjects ?? []

      const examData =
        examsResult.data ?? examsResult.exams ?? []

      const markData =
        marksResult.data ?? marksResult.marks ?? []

      const assignmentData =
        assignmentsResult.data ??
        assignmentsResult.assignments ??
        []

      setStudents(studentData)
      setSubjects(subjectData)
      setExams(examData)
      setMarks(markData)
      setAssignments(assignmentData)
    } catch (error) {
      console.error(error)

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load marks data"
      )

      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const classes = useMemo(() => {
    const names = students
      .map((student) => student.className)
      .filter(Boolean) as string[]

    return Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )
  }, [students])

  const classStudents = useMemo(() => {
    if (!selectedClass) return []

    return students.filter(
      (student) =>
        normalizeClassName(student.className ?? "") ===
        normalizeClassName(selectedClass)
    )
  }, [students, selectedClass])

  const classSubjects = useMemo(() => {
    if (!selectedClass) return subjects

    const className = normalizeClassName(selectedClass)

    if (
      className === "playgroup" ||
      className === "pp1" ||
      className === "pp2"
    ) {
      return subjects.filter((subject) => {
        const name = subject.name.toLowerCase()

        return (
          name.includes("activity") ||
          name.includes("religious") ||
          name.includes("environmental") ||
          name.includes("mathematical") ||
          name.includes("creative")
        )
      })
    }

    if (
      className === "grade1" ||
      className === "grade2" ||
      className === "grade3"
    ) {
      return subjects.filter((subject) => {
        const name = subject.name.toLowerCase()

        return (
          name.includes("activities") ||
          name.includes("english") ||
          name.includes("kiswahili") ||
          name.includes("religious") ||
          name.includes("environmental") ||
          name.includes("mathematical") ||
          name.includes("creative")
        )
      })
    }

    if (
      className === "grade4" ||
      className === "grade5" ||
      className === "grade6"
    ) {
      return subjects.filter((subject) => {
        const name = subject.name.toLowerCase()

        return (
          name.includes("english") ||
          name.includes("kiswahili") ||
          name.includes("religious") ||
          name.includes("social") ||
          name.includes("science") ||
          name.includes("mathematics") ||
          name.includes("agriculture") ||
          name.includes("creative")
        )
      })
    }

    if (
      className === "grade7" ||
      className === "grade8" ||
      className === "grade9"
    ) {
      return subjects.filter((subject) => {
        const name = subject.name.toLowerCase()

        return (
          name.includes("mathematics") ||
          name.includes("integrated science") ||
          name.includes("pre-technical") ||
          name.includes("agriculture") ||
          name.includes("english") ||
          name.includes("kiswahili") ||
          name.includes("religious") ||
          name.includes("creative")
        )
      })
    }

    return subjects
  }, [subjects, selectedClass])

  const availableSubjects = useMemo(() => {
    if (!selectedClass) return []

    if (isAdmin) {
      return classSubjects
    }

    if (!isTeacher) {
      return []
    }

    const selectedClassKey =
      normalizeClassName(selectedClass)

    const teacherAssignments = assignments.filter(
      (assignment) =>
        normalizeClassName(assignment.class_name) ===
        selectedClassKey
    )

    const assignedSubjectIds = new Set(
      teacherAssignments.map((assignment) =>
        String(assignment.subject_id)
      )
    )

    return classSubjects.filter((subject) =>
      assignedSubjectIds.has(String(subject.id))
    )
  }, [
    selectedClass,
    assignments,
    classSubjects,
    isAdmin,
    isTeacher,
  ])

  useEffect(() => {
    setSelectedSubject("")
    setScores({})
  }, [selectedClass])

  useEffect(() => {
    if (!selectedExam || !selectedSubject) {
      setScores({})
      return
    }

    const nextScores: Record<string, string> = {}

    for (const student of classStudents) {
      const existingMark = marks.find(
        (mark) =>
          String(mark.studentId) === String(student.id) &&
          String(mark.subjectId) === String(selectedSubject) &&
          String(mark.examId) === String(selectedExam)
      )

      nextScores[String(student.id)] =
        existingMark?.score !== undefined &&
        existingMark?.score !== null
          ? String(existingMark.score)
          : ""
    }

    setScores(nextScores)
  }, [
    selectedExam,
    selectedSubject,
    classStudents,
    marks,
  ])

  useEffect(() => {
    if (!selectedSubject) return

    const stillAvailable = availableSubjects.some(
      (subject) =>
        String(subject.id) === String(selectedSubject)
    )

    if (!stillAvailable) {
      setSelectedSubject("")
    }
  }, [availableSubjects, selectedSubject])

  const selectedSubjectObject = useMemo(() => {
    return availableSubjects.find(
      (subject) =>
        String(subject.id) === String(selectedSubject)
    )
  }, [availableSubjects, selectedSubject])

  function updateScore(
    studentId: string,
    value: string
  ) {
    if (value === "") {
      setScores((previous) => ({
        ...previous,
        [studentId]: "",
      }))
      return
    }

    const numericValue = Number(value)

    if (Number.isNaN(numericValue)) return

    const clamped = Math.max(
      0,
      Math.min(100, numericValue)
    )

    setScores((previous) => ({
      ...previous,
      [studentId]: String(clamped),
    }))
  }

  async function saveMarks() {
    setMessage("")

    if (!selectedClass) {
      setMessage("Please select a class.")
      setMessageType("error")
      return
    }

    if (!selectedExam) {
      setMessage("Please select an exam.")
      setMessageType("error")
      return
    }

    if (!selectedSubject) {
      setMessage("Please select a subject.")
      setMessageType("error")
      return
    }

    if (!isAdmin && !isTeacher) {
      setMessage("You are not allowed to enter marks.")
      setMessageType("error")
      return
    }

    if (classStudents.length === 0) {
      setMessage("There are no students in this class.")
      setMessageType("error")
      return
    }

    const entries = classStudents.map((student) => {
      const rawValue = scores[String(student.id)]

      const score =
        rawValue === "" ||
        rawValue === undefined
          ? null
          : Number(rawValue)

      return {
        studentId: student.id,
        subjectId: selectedSubject,
        score,
      }
    })

    try {
      setSaving(true)

      const response = await fetch("/api/marks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: selectedExam,
          entries,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            result.error ||
            "Failed to save marks"
        )
      }

      setMessage(
        `${selectedSubjectObject?.name ?? "Subject"} marks saved successfully.`
      )

      setMessageType("success")

      await loadData()
    } catch (error) {
      console.error(error)

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save marks"
      )

      setMessageType("error")
    } finally {
      setSaving(false)
    }
  }

  function downloadClassMarks() {
    if (
      !selectedClass ||
      !selectedExam ||
      !selectedSubject
    ) {
      setMessage(
        "Select a class, exam and subject before downloading."
      )
      setMessageType("error")
      return
    }

    const subject = subjects.find(
      (item) =>
        String(item.id) === String(selectedSubject)
    )

    const exam = exams.find(
      (item) =>
        String(item.id) === String(selectedExam)
    )

    const rows = [
      [
        "Admission No.",
        "Student Name",
        "Class",
        "Stream",
        subject?.name ?? "Subject",
        "Exam",
      ],
      ...classStudents.map((student) => {
        const score =
          scores[String(student.id)] ?? ""

        return [
          student.admissionNo ?? "",
          getStudentName(student),
          student.className ?? "",
          student.stream ?? "",
          score,
          exam?.name ?? "",
        ]
      }),
    ]

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "")

            return `"${text.replace(/"/g, '""')}"`
          })
          .join(",")
      )
      .join("\n")

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")

    link.href = url

    link.download =
      `${selectedClass}-${subject?.name ?? "marks"}-${exam?.name ?? "exam"}.csv`
        .replace(/\s+/g, "-")

    document.body.appendChild(link)

    link.click()

    link.remove()

    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin" />

          <p className="text-sm text-muted-foreground">
            Loading marks...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Marks Entry
        </h1>

        <p className="text-sm text-muted-foreground">
          Select a class, exam and subject to enter marks.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}

          <span>{message}</span>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">

          <div className="space-y-2">
            <label
              htmlFor="class"
              className="text-sm font-medium"
            >
              Class
            </label>

            <select
              id="class"
              value={selectedClass}
              onChange={(event) =>
                setSelectedClass(event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
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

          <div className="space-y-2">
            <label
              htmlFor="exam"
              className="text-sm font-medium"
            >
              Exam
            </label>

            <select
              id="exam"
              value={selectedExam}
              onChange={(event) =>
                setSelectedExam(event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">
                Select exam
              </option>

              {exams.map((exam) => (
                <option
                  key={exam.id}
                  value={exam.id}
                >
                  {exam.name}
                  {exam.term
                    ? ` — ${exam.term}`
                    : ""}
                  {exam.year
                    ? ` ${exam.year}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="subject"
              className="text-sm font-medium"
            >
              Subject
            </label>

            <select
              id="subject"
              value={selectedSubject}
              onChange={(event) =>
                setSelectedSubject(event.target.value)
              }
              disabled={!selectedClass}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {!selectedClass
                  ? "Select class first"
                  : isTeacher &&
                    availableSubjects.length === 0
                  ? "No assigned subjects"
                  : "Select subject"}
              </option>

              {availableSubjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                  {subject.code
                    ? ` (${subject.code})`
                    : ""}
                </option>
              ))}
            </select>

            {isTeacher &&
              selectedClass &&
              availableSubjects.length === 0 && (
                <p className="text-xs text-red-600">
                  No subjects are assigned to your account
                  for this class.
                </p>
              )}
          </div>
        </div>
      </div>

      {selectedClass &&
        selectedExam &&
        selectedSubject &&
        selectedSubjectObject && (
          <div className="space-y-4">

            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  {selectedClass} —{" "}
                  {selectedSubjectObject.name}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {classStudents.length} student
                  {classStudents.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={downloadClassMarks}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>

                <button
                  type="button"
                  onClick={saveMarks}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
  <>
    <RefreshCw className="h-4 w-4 animate-spin" />
    Saving...
  </>
) : (
  <>
    <CheckCircle className="h-4 w-4" />
    Save All Marks
  </>
)}
</button>
                  
