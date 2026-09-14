"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react"

import { useSchool } from "@/lib/store"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Student = {
  id: string
  admissionNo: string
  firstName: string
  middleName?: string
  lastName?: string
  classId?: string
  className?: string
  stream?: string
  status?: string
}

type Subject = {
  id: string
  name: string
  code?: string
  category?: string
}

type Exam = {
  id: string
  name: string
  term?: string
  year?: number
  outOf?: number
}

type Mark = {
  id?: string
  examId: string
  studentId: string
  subjectId: string
  score: number
}

type SchoolClass = {
  id: string
  name: string
  streams?: string[]
  classTeacherId?: string | null
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

type Teacher = {
  id: string
  firstName?: string
  middleName?: string
  lastName?: string
  name?: string
  email?: string
}

export default function MarksPage() {
  const { role, currentUser } = useSchool()

  const normalizedRole = String(role ?? "").toLowerCase()
  const isAdmin = normalizedRole === "admin"
  const isTeacher = normalizedRole === "teacher"

  const [students, setStudents] = useState<Student[]>([])
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")

  const [scores, setScores] =
    useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info" | ""
  >("")

  async function loadData() {
    try {
      setLoading(true)

      const [
        studentsResponse,
        classesResponse,
        subjectsResponse,
        examsResponse,
        marksResponse,
        assignmentsResponse,
        teachersResponse,
      ] = await Promise.all([
        fetch("/api/students", {
          cache: "no-store",
        }),

        fetch("/api/classes", {
          cache: "no-store",
        }),

        fetch("/api/subjects", {
          cache: "no-store",
        }),

        fetch("/api/exams", {
          cache: "no-store",
        }),

        fetch("/api/marks", {
          cache: "no-store",
        }),

        fetch("/api/teacher-subject-assignments", {
          cache: "no-store",
        }),

        fetch("/api/teachers", {
          cache: "no-store",
        }),
      ])

      if (!studentsResponse.ok) {
        throw new Error("Failed to load students.")
      }

      if (!classesResponse.ok) {
        throw new Error("Failed to load classes.")
      }

      if (!subjectsResponse.ok) {
        throw new Error("Failed to load subjects.")
      }

      if (!examsResponse.ok) {
        throw new Error("Failed to load exams.")
      }

      const studentsData =
        await studentsResponse.json()

      const classesData =
        await classesResponse.json()

      const subjectsData =
        await subjectsResponse.json()

      const examsData =
        await examsResponse.json()

      const marksData =
        marksResponse.ok
          ? await marksResponse.json()
          : []

      const assignmentsData =
        assignmentsResponse.ok
          ? await assignmentsResponse.json()
          : []

      const teachersData =
        teachersResponse.ok
          ? await teachersResponse.json()
          : []

      const loadedStudents: Student[] =
        Array.isArray(studentsData)
          ? studentsData
          : studentsData.data ??
            studentsData.students ??
            []

      const loadedClasses: SchoolClass[] =
        Array.isArray(classesData)
          ? classesData
          : classesData.data ??
            classesData.classes ??
            []

      const loadedSubjects: Subject[] =
        Array.isArray(subjectsData)
          ? subjectsData
          : subjectsData.data ??
            subjectsData.subjects ??
            []

      const loadedExams: Exam[] =
        Array.isArray(examsData)
          ? examsData
          : examsData.data ??
            examsData.exams ??
            []

      const loadedMarks: Mark[] =
        Array.isArray(marksData)
          ? marksData
          : marksData.data ??
            marksData.marks ??
            []

      const loadedAssignments: Assignment[] =
        Array.isArray(assignmentsData)
          ? assignmentsData
          : assignmentsData.data ??
            assignmentsData.assignments ??
            []

      const loadedTeachers: Teacher[] =
        Array.isArray(teachersData)
          ? teachersData
          : teachersData.data ??
            teachersData.teachers ??
            []

      setStudents(loadedStudents)
      setSchoolClasses(loadedClasses)
      setSubjects(loadedSubjects)
      setExams(loadedExams)
      setMarks(loadedMarks)
      setAssignments(loadedAssignments)
      setTeachers(loadedTeachers)
    } catch (error) {
      console.error(
        "Failed to load marks data:",
        error
      )

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load marks data."
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
    return schoolClasses
      .map((item) =>
        String(item.name ?? "").trim()
      )
      .filter(Boolean)
      .sort((a, b) =>
        a.localeCompare(b, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      )
  }, [schoolClasses])

  function normalize(value: unknown) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
  }

  function getStudentClassName(
    student: Student
  ) {
    return String(
      student.className ??
        student.classId ??
        ""
    ).trim()
  }

  const classStudents = useMemo(() => {
    if (!selectedClass) {
      return []
    }

    return students
      .filter((student) => {
        const sameClass =
          normalize(
            getStudentClassName(student)
          ) === normalize(selectedClass)

        const active =
          normalize(student.status) !==
          "inactive"

        return sameClass && active
      })
      .sort((a, b) =>
       `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        )
      )
  }, [students, selectedClass])

  /*
   * Find the actual teacher record for the
   * currently logged-in teacher.
   */
  const currentTeacher = useMemo(() => {
    if (!isTeacher) {
      return null
    }

    const userName = normalize(
      currentUser?.name
    )

    const userEmail = normalize(
      currentUser?.email
    )

    const found = teachers.find((teacher) => {
      const teacherName = normalize(
        teacher.name ??
          [
            teacher.firstName,
            teacher.middleName,
            teacher.lastName,
          ]
            .filter(Boolean)
            .join(" ")
      )

      const teacherEmail =
        normalize(teacher.email)

      if (
        userEmail &&
        teacherEmail &&
        userEmail === teacherEmail
      ) {
        return true
      }

      if (
        userName &&
        teacherName &&
        userName === teacherName
      ) {
        return true
      }

      return false
    })

    return found ?? null
  }, [
    teachers,
    currentUser,
    isTeacher,
  ])

  /*
   * Subjects available for the selected class.
   *
   * ADMIN:
   *   sees subjects belonging to the class category.
   *
   * TEACHER:
   *   sees ONLY subjects assigned to that
   *   teacher for that class.
   */
  const availableSubjects = useMemo(() => {
    if (!selectedClass) {
      return []
    }

    if (isTeacher) {
      /*
       * If the API already filtered assignments
       * for the logged-in teacher, these are the
       * teacher's assignments.
       *
       * If it returns all assignments, use the
       * teacher record to filter them here.
       */
      let teacherAssignments = assignments

      if (currentTeacher?.id) {
        teacherAssignments =
          assignments.filter(
            (assignment) =>
              String(
                assignment.teacher_id
              ) ===
              String(currentTeacher.id)
          )
      } else {
        /*
         * If teacher cannot be resolved yet,
         * do not expose every subject.
         */
        teacherAssignments = []
      }

      const classAssignments =
        teacherAssignments.filter(
          (assignment) =>
            normalize(
              assignment.class_name
            ) ===
            normalize(selectedClass)
        )

      const subjectIds = new Set(
        classAssignments.map((assignment) =>
          String(assignment.subject_id)
        )
      )

      return subjects
        .filter((subject) =>
          subjectIds.has(String(subject.id))
        )
        .sort((a, b) =>
          a.name.localeCompare(b.name)
        )
    }

    /*
     * Admin sees subjects for the selected
     * class category.
     */
    const className =
      selectedClass.toLowerCase()

    let category = ""

    if (
      className.includes("play") ||
      className.includes("pp1") ||
      className.includes("pp2")
    ) {
      category = "Pre-primary"
    } else if (
      className.includes("grade 1") ||
      className.includes("grade 2") ||
      className.includes("grade 3")
    ) {
      category = "Lower Primary"
    } else if (
      className.includes("grade 4") ||
      className.includes("grade 5") ||
      className.includes("grade 6")
    ) {
      category = "Upper Primary"
    } else if (
      className.includes("grade 7") ||
      className.includes("grade 8") ||
      className.includes("grade 9")
    ) {
      category = "Junior School"
    }

    if (!category) {
      return subjects
    }

    const matching = subjects.filter(
      (subject) =>
        normalize(subject.category) ===
        normalize(category)
    )

    return matching.length > 0
      ? matching.sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      : subjects.sort((a, b) =>
          a.name.localeCompare(b.name)
        )
  }, [
    assignments,
    subjects,
    selectedClass,
    isTeacher,
    currentTeacher,
  ])

  /*
   * When class changes, reset subject.
   */
  useEffect(() => {
    setSelectedSubject("")
    setScores({})
  }, [selectedClass])

  /*
   * If the selected subject is no longer available,
   * clear it.
   */
  useEffect(() => {
    if (
      selectedSubject &&
      !availableSubjects.some(
        (subject) =>
          String(subject.id) ===
          String(selectedSubject)
      )
    ) {
      setSelectedSubject("")
      setScores({})
    }
  }, [
    availableSubjects,
    selectedSubject,
  ])

  const selectedSubjectObject =
    availableSubjects.find(
      (subject) =>
        String(subject.id) ===
        String(selectedSubject)
    )

  function scoreKey(
    studentId: string,
    subjectId: string
  ) {
    return `${studentId}__${subjectId}`
  }

  /*
   * Load existing marks for the selected
   * class + exam + subject.
   */
  useEffect(() => {
    if (
      !selectedClass ||
      !selectedExam ||
      !selectedSubject
    ) {
      setScores({})
      return
    }

    const existing: Record<
      string,
      string
    > = {}

    marks.forEach((mark) => {
      const studentExists =
        classStudents.some(
          (student) =>
            String(student.id) ===
            String(mark.studentId)
        )

      if (
        String(mark.examId) ===
          String(selectedExam) &&
        String(mark.subjectId) ===
          String(selectedSubject) &&
        studentExists
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
    selectedSubject,
    marks,
    classStudents,
  ])

  function updateScore(
    studentId: string,
    subjectId: string,
    value: string
  ) {
    if (value === "") {
      setScores((current) => ({
        ...current,
        [scoreKey(
          studentId,
          subjectId
        )]: "",
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
      [scoreKey(
        studentId,
        subjectId
      )]: String(limited),
    }))
  }

  async function saveMarks() {
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

    if (classStudents.length === 0) {
      setMessage(
        "No students found in this class."
      )
      setMessageType("error")
      return
    }

    const entries: {
      studentId: string
      subjectId: string
      score: number
    }[] = []

    classStudents.forEach((student) => {
      const value =
        scores[
          scoreKey(
            String(student.id),
            String(selectedSubject)
          )
        ]

      if (
        value !== undefined &&
        value !== ""
      ) {
        const score = Number(value)

        if (
          !Number.isNaN(score) &&
          score >= 0 &&
          score <= 100
        ) {
          entries.push({
            studentId: String(
              student.id
            ),
            subjectId: String(
              selectedSubject
            ),
            score,
          })
        }
      }
    })

    if (entries.length === 0) {
      setMessage(
        "Enter at least one mark before saving."
      )
      setMessageType("error")
      return
    }

    try {
      setSaving(true)

      setMessage(
        `Saving ${entries.length} mark${
          entries.length === 1
            ? ""
            : "s"
        }...`
      )

      setMessageType("info")

      const response = await fetch(
        "/api/marks",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            examId: selectedExam,
            entries,
          }),
        }
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to save marks."
        )
      }

      setMessage(
        `✓ ${entries.length} mark${
          entries.length === 1
            ? ""
            : "s"
        } saved successfully.`
      )
setMessageType("success")

      await loadData()
    } catch (error) {
      console.error(
        "Save marks error:",
        error
      )

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save marks."
      )

      setMessageType("error")
    } finally {
      setSaving(false)
    }
  }

  function downloadClassMarks() {
    if (!selectedClass) {
      setMessage(
        "Please select a class first."
      )
      setMessageType("error")
      return
    }

    if (!selectedExam) {
      setMessage(
        "Please select an exam first."
      )
      setMessageType("error")
      return
    }

    if (!selectedSubject) {
      setMessage(
        "Please select a subject first."
      )
      setMessageType("error")
      return
    }

    if (classStudents.length === 0) {
      setMessage(
        "There are no students in this class."
      )
      setMessageType("error")
      return
    }

    const selectedExamObject =
      exams.find(
        (exam) =>
          String(exam.id) ===
          String(selectedExam)
      )

    const subjectName =
      selectedSubjectObject?.name ||
      "Subject"

    const subjectCode =
      selectedSubjectObject?.code ||
      ""

    const headers = [
      "No.",
      "Admission Number",
      "Student Name",
      "Stream",
      `${subjectName}${
        subjectCode
          ? ` (${subjectCode})`
          : ""
      }`,
    ]

    const rows =
      classStudents.map(
        (student, index) => {
          const value =
            scores[
              scoreKey(
                String(student.id),
                String(selectedSubject)
              )
            ]

          return [
            index + 1,
            student.admissionNo,
            `${student.firstName} ${
              student.middleName || ""
            } ${
              student.lastName || ""
            }`.replace(/\s+/g, " ").trim(),
            student.stream || "",
            value ?? "",
          ]
        }
      )

    function csvEscape(
      value: unknown
    ) {
      const text = String(
        value ?? ""
      )

      return `"${text.replace(
        /"/g,
        '""'
      )}"`
    }

    const csv = [
      headers
        .map(csvEscape)
        .join(","),
      ...rows.map((row) =>
        row.map(csvEscape).join(",")
      ),
    ].join("\n")

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement("a")

    link.href = url

    const examName =
      selectedExamObject?.name ||
      "Marks"

    const safeClass =
      selectedClass.replace(
        /[^a-z0-9]+/gi,
        "_"
      )

    const safeSubject =
      subjectName.replace(
        /[^a-z0-9]+/gi,
        "_"
      )

    const safeExam =
      examName.replace(
        /[^a-z0-9]+/gi,
        "_"
      )

    link.download =
      `${safeClass}_${safeSubject}_${safeExam}_Marks.csv`

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    setMessage(
     `${selectedClass} ${subjectName} marks downloaded successfully.`
    )

    setMessageType("success")
  }

  const selectedExamObject =
    exams.find(
      (exam) =>
        String(exam.id) ===
        String(selectedExam)
    )

  const canSaveMarks =
    isAdmin || isTeacher

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marks Entry"
        description="Select a class, exam and assigned subject to enter marks."
      />

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Loading students, classes,
              subjects, exams and marks...
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Marks Selection
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {/* CLASS */}
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

                      setSelectedSubject(
                        ""
                      )

                      setScores({})

                      setMessage("")
                      setMessageType("")
                    }}
                    className="w-full rounded-md border bg-background p-2"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map(
                      (className) => (
                        <option
                          key={className}
                          value={className}
                        >
                          {className}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* EXAM */}
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

                      setScores({})

                      setMessage("")
                      setMessageType("")
                    }}
                    className="w-full rounded-md border bg-background p-2"
                  >
                    <option value="">
                      Select exam
                    </option>

                    {exams.map(
                      (exam) => (
                        <option
                          key={exam.id}
                          value={exam.id}
                        >
                          {exam.name}
                          {exam.term
                            ? ` - ${exam.term}`
                            : ""}
                          {exam.year
                            ? ` ${exam.year}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* SUBJECT */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Subject
                  </label>

                  <select
                    value={selectedSubject}
                    onChange={(event) => {
                      setSelectedSubject(
                        event.target.value
                      )

                      setScores({})

                      setMessage("")
                      setMessageType("")
                    }}
                    disabled={
                      !selectedClass ||
                      availableSubjects.length ===
                        0
                    }
                    className="w-full rounded-md border bg-background p-2"
                  >
                    <option value="">
                      {!selectedClass
                        ? "Select class first"
                        : availableSubjects.length ===
                            0
                          ? isTeacher
                            ? "No assigned subject"
                            : "No subjects"
                          : "Select subject"}
                    </option>

                    {availableSubjects.map(
                      (subject) => (
                        <option
                          key={subject.id}
                          value={subject.id}
                        >
                          {subject.name}
                          {subject.code
                            ? ` (${subject.code})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* ACTIONS */}
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={loadData}
                    disabled={
                      loading || saving
                    }
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {isTeacher &&
                selectedClass &&
                availableSubjects.length ===
                  0 && (
                  <div className="mt-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
                    No subject has been assigned
                    to your teacher account for{" "}
                    <strong>
                      {selectedClass}
                    </strong>
                    .
                  </div>
                )}

              {selectedClass && (
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
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
                      Available Subjects
                    </p>

                    <p className="font-semibold">
                      {availableSubjects.length}
                    </p>
                  </div>

                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Selected Subject
                    </p>

                    <p className="font-semibold">
                      {selectedSubjectObject?.name ||
                        "None"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedClass &&
            selectedExam &&
            selectedSubject && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedClass} —{" "}
                    {selectedSubjectObject?.name}
                  </CardTitle>

                  <p className="text-sm text-muted-foreground">
                    {selectedExamObject?.name ||
                      "Selected Exam"}
                    {" • "}
                    Enter marks out of 100.
                  </p>
                </CardHeader>

                <CardContent>
                  {classStudents.length ===
                  0 ? (
                    <div className="rounded-md border p-8 text-center">
                      <p className="font-medium">
                        No students found.
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        There are no active students
                        registered in{" "}
                        {selectedClass}.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left">
                                #
                              </th>

                              <th className="p-3 text-left">
                                Admission No.
                              </th>

                              <th className="p-3 text-left">
                                Student Name
                              </th>

                              <th className="p-3 text-left">
                                Stream
                              </th>

                              <th className="min-w-32 p-3 text-center">
                                {
                                  selectedSubjectObject?.name
                                }

                                <div className="text-xs font-normal text-muted-foreground">
                                  {
                                    selectedSubjectObject?.code
                                  }
                                </div>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {classStudents.map(
                              (
                                student,
                                index
                              ) => {
                                const key =
                                  scoreKey(
                                    String(
                                      student.id
                                    ),
                                    String(
                                      selectedSubject
                                    )
                                  )

                                return (
                                  <tr
                                    key={
                                      student.id
                                    }
                                    className="border-b last:border-0"
                                  >
                                    <td className="p-3">
                                      {index +
                                        1}
                                    </td>

                                    <td className="p-3 font-mono text-xs">
                                      {
                                        student.admissionNo
                                      }
                                    </td>

                                    <td className="p-3 font-medium">
                                      {
                                        student.firstName
                                      }{" "}
                                      {
                                        student.middleName
                                      }{" "}
                                      {
                                        student.lastName
                                      }
                                    </td>

                                    <td className="p-3 text-muted-foreground">
                                      {student.stream ||
                                        "—"}
                                    </td>

                                    <td className="p-2 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={
                                          scores[
                                            key
                                          ] ??
                                          ""
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          updateScore(
                                            String(
                                              student.id
                                            ),
                                            String(
                                              selectedSubject
                                            ),
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        className="h-9 w-24 rounded-md border bg-background px-2 text-center outline-none focus:ring-2 focus:ring-ring"
                                        aria-label={`${selectedSubjectObject?.name} mark for ${student.firstName} ${student.lastName}`}
                                      />
                                    </td>
                                  </tr>
                                )
                              }
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                        {canSaveMarks && (
                          <Button
                            onClick={
                              saveMarks
                            }
                            disabled={saving}
                          >
                            {saving
                              ? "Saving..."
                              : "Save All Marks"}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={
                            downloadClassMarks
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Marks
                        </Button>

                        {message && (
                          <div
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                              messageType ===
                              "success"
                                ? "border-green-500/30 bg-green-500/10"
                                : messageType ===
                                    "error"
                                  ? "border-red-500/30 bg-red-500/10"
                                  : "bg-muted/30"
                            }`}
                          >
                            {messageType ===
                              "success" && (
                              <CheckCircle className="h-4 w-4" />
                            )}

                            {messageType ===
                              "error" && (
                              <XCircle className="h-4 w-4" />
                            )}

                            <span>
                              {message}
                            </span>
                          </div>
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
