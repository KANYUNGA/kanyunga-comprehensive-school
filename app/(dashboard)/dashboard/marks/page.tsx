
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
  id: number
  admissionNo: string
  firstName: string
  middleName?: string
  lastName?: string
  classId?: number
  className?: string
  stream?: string
  status?: string
}

type Subject = {
  id: number
  name: string
  code?: string
  category?: string
}

type Exam = {
  id: number
  name: string
  term?: string
  year?: number
  outOf?: number
}

type Mark = {
  id?: number
  examId: number
  studentId: number
  subjectId: number
  score: number
}

type SchoolClass = {
  id: number
  name: string
  streams?: string[]
  classTeacherId?: number
}

type Assignment = {
  assignment_id: number
  teacher_id: number
  subject_id: number
  subject_name: string
  subject_code?: string
  class_id: number
  class_name: string
}

type Teacher = {
  id: number
  firstName?: string
  middleName?: string
  lastName?: string
  name?: string
  email?: string
}

type ResultRow = {
  student: Student
  subjectScores: Record<number, number | null>
  total: number
  completedSubjects: number
  position: number | null
}

export default function MarksPage() {
  const { role, currentUser } = useSchool()

  /*
   * =========================================================
   * ROLE
   * =========================================================
   */

  const normalizedRole =
    typeof role === "string"
      ? role.trim().toLowerCase()
      : ""

  const isAdmin =
    normalizedRole === "admin" ||
    normalizedRole === "administrator"

  const isTeacher =
    normalizedRole === "teacher"

  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [students, setStudents] =
    useState<Student[]>([])

  const [schoolClasses, setSchoolClasses] =
    useState<SchoolClass[]>([])

  const [subjects, setSubjects] =
    useState<Subject[]>([])

  const [exams, setExams] =
    useState<Exam[]>([])

  const [marks, setMarks] =
    useState<Mark[]>([])

  const [assignments, setAssignments] =
    useState<Assignment[]>([])

  const [teachers, setTeachers] =
    useState<Teacher[]>([])

  const [selectedClass, setSelectedClass] =
    useState("")

  const [selectedExam, setSelectedExam] =
    useState("")

  const [selectedSubject, setSelectedSubject] =
    useState("")

  const [scores, setScores] =
    useState<Record<string, number | "">>({})

  const [loading, setLoading] =
    useState(true)

  const [marksLoading, setMarksLoading] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const [messageType, setMessageType] =
    useState<"success" | "error">("success")

  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function normalize(value: unknown) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
  }

  function parseArray(json: any, key: string) {
    if (Array.isArray(json)) {
      return json
    }

    return json?.[key] ?? json?.data ?? []
  }

  function mapMarksData(data: any): Mark[] {
    const marksData = parseArray(data, "marks")

    return marksData
      .map((item: any) => ({
        id:
          item.id != null
            ? Number(item.id)
            : undefined,

        examId: Number(
          item.examId ??
            item.exam_id ??
            0
        ),

        studentId: Number(
          item.studentId ??
            item.student_id ??
            0
        ),

        subjectId: Number(
          item.subjectId ??
            item.subject_id ??
            0
        ),

        score: Number(
          item.score ??
            item.marks ??
            0
        ),
      }))
      .filter(
        (mark: Mark) =>
          mark.examId > 0 &&
          mark.studentId > 0 &&
          mark.subjectId > 0
      )
  }

  /*
   * =========================================================
   * LOAD MAIN DATA
   * =========================================================
   */

  async function loadData() {
    try {
      setLoading(true)
      setMessage("")

      const [
        studentsRes,
        classesRes,
        subjectsRes,
        examsRes,
        assignmentsRes,
        teachersRes,
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

        fetch(
          "/api/teacher-subject-assignments",
          {
            cache: "no-store",
          }
        ),

        fetch("/api/teachers", {
          cache: "no-store",
        }),
      ])

      if (!studentsRes.ok) {
        throw new Error(
          "Failed to load students"
        )
      }

      if (!classesRes.ok) {
        throw new Error(
          "Failed to load classes"
        )
      }

      if (!subjectsRes.ok) {
        throw new Error(
          "Failed to load subjects"
        )
      }

      if (!examsRes.ok) {
        throw new Error(
          "Failed to load exams"
        )
      }

      const studentsJson =
        await studentsRes.json()

      const classesJson =
        await classesRes.json()

      const subjectsJson =
        await subjectsRes.json()

      const examsJson =
        await examsRes.json()

      const assignmentsJson =
        assignmentsRes.ok
          ? await assignmentsRes.json()
          : []

      const teachersJson =
        teachersRes.ok
          ? await teachersRes.json()
          : []

      const studentsData =
        parseArray(
          studentsJson,
          "students"
        )

      const classesData =
        parseArray(
          classesJson,
          "classes"
        )

      const subjectsData =
        parseArray(
          subjectsJson,
          "subjects"
        )

      const examsData =
        parseArray(
          examsJson,
          "exams"
        )

      const assignmentsData =
        parseArray(
          assignmentsJson,
          "assignments"
        )

      const teachersData =
        parseArray(
          teachersJson,
          "teachers"
        )

      setStudents(
        studentsData.map(
          (student: any) => ({
            id: Number(student.id),

            admissionNo: String(
              student.admissionNo ??
                student.admission_number ??
                student.admissionNumber ??
                ""
            ),

            firstName: String(
              student.firstName ??
                student.first_name ??
                ""
            ),

            middleName:
              student.middleName ??
              student.middle_name ??
              "",

            lastName:
              student.lastName ??
              student.last_name ??
              "",

            classId:
              student.classId != null
                ? Number(
                    student.classId
                  )
                : student.class_id != null
                  ? Number(
                      student.class_id
                    )
                  : undefined,

            className:
              student.className ??
              student.class_name ??
              "",

            stream:
              student.stream ?? "",

            status:
              student.status ??
              "Active",
          })
        )
      )

      setSchoolClasses(
        classesData.map(
          (item: any) => ({
            id: Number(item.id),

            name: String(
              item.name ??
                item.className ??
                item.class_name ??
                ""
            ),

            streams:
              item.streams ?? [],

            classTeacherId:
              item.classTeacherId != null
                ? Number(
                    item.classTeacherId
                  )
                : item.class_teacher_id != null
                  ? Number(
                      item.class_teacher_id
                    )
                  : undefined,
          })
        )
      )

      setSubjects(
        subjectsData.map(
          (item: any) => ({
            id: Number(item.id),

            name: String(
              item.name ?? ""
            ),

            code:
              item.code ?? "",

            category:
              item.category ?? "",
          })
        )
      )

      setExams(
        examsData.map(
          (item: any) => ({
            id: Number(item.id),

            name: String(
              item.name ??
                item.examName ??
                item.exam_name ??
                ""
            ),

            term:
              item.term ?? "",

            year:
              item.year != null
                ? Number(item.year)
                : undefined,

            outOf:
              item.outOf != null
                ? Number(
                    item.outOf
                  )
                : item.out_of != null
                  ? Number(
                      item.out_of
                    )
                  : 100,
          })
        )
      )

      setAssignments(
        assignmentsData.map(
          (item: any) => ({
            assignment_id:
              Number(
                item.assignment_id ??
                  item.id ??
                  0
              ),

            teacher_id:
              Number(
                item.teacher_id ??
                  item.teacherId ??
                  0
              ),

            subject_id:
              Number(
                item.subject_id ??
                  item.subjectId ??
                  0
              ),

            subject_name:
              String(
                item.subject_name ??
                  item.subjectName ??
                  ""
              ),

            subject_code:
              item.subject_code ??
              item.subjectCode ??
              "",

            class_id:
              Number(
                item.class_id ??
                  item.classId ??
                  0
              ),

            class_name:
              String(
                item.class_name ??
                  item.className ??
                  ""
              ),
          })
        )
      )

      setTeachers(
        teachersData.map(
          (item: any) => ({
            id: Number(item.id),

            firstName:
              item.firstName ??
              item.first_name ??
              "",

            middleName:
              item.middleName ??
              item.middle_name ??
              "",

            lastName:
              item.lastName ??
              item.last_name ??
              "",

            name:
              item.name ?? "",

            email:
              item.email ?? "",
          })
        )
      )
    } catch (error) {
      console.error(
        "Failed to load marks page data:",
        error
      )

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

  /*
   * =========================================================
   * LOAD MARKS FOR SELECTED EXAM
   *
   * IMPORTANT:
   * We deliberately load by exam only.
   *
   * This allows the historical Grade 7 marks
   * to be displayed even if the class_id/student
   * relationship differs between the marks and
   * students tables.
   * =========================================================
   */

  async function loadMarks(
    examIdValue = selectedExam
  ) {
    if (!examIdValue) {
      setMarks([])
      return
    }

    try {
      setMarksLoading(true)

      const params =
        new URLSearchParams()

      params.set(
        "examId",
        String(examIdValue)
      )

      const response =
        await fetch(
          `/api/marks?${params.toString()}`,
          {
            cache: "no-store",
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to load marks"
        )
      }

      const loadedMarks =
        mapMarksData(data)

      console.log(
        "MARKS LOADED:",
        loadedMarks.length
      )

      setMarks(loadedMarks)
    } catch (error) {
      console.error(
        "Failed to load marks:",
        error
      )

      setMarks([])

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load marks"
      )

      setMessageType("error")
    } finally {
      setMarksLoading(false)
    }
  }

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {
    loadData()
  }, [])

  /*
   * =========================================================
   * AUTOMATICALLY SELECT GRADE 7 + MID-TERM 2026
   * =========================================================
   */

  useEffect(() => {
    if (
      schoolClasses.length === 0 ||
      exams.length === 0
    ) {
      return
    }

    if (!selectedClass) {
      const grade7 =
        schoolClasses.find(
          (schoolClass) =>
            normalize(
              schoolClass.name
            ) === "grade 7"
        )

      if (grade7) {
        setSelectedClass(
          String(grade7.id)
        )
      }
    }

    if (!selectedExam) {
      const midTerm2026 =
        exams.find(
          (exam) =>
            normalize(
              exam.name
            ) ===
              "mid-term exam" &&
            Number(exam.year) ===
              2026
        )

      if (midTerm2026) {
        setSelectedExam(
          String(midTerm2026.id)
        )
      }
    }
  }, [
    schoolClasses,
    exams,
    selectedClass,
    selectedExam,
  ])

  /*
   * =========================================================
   * LOAD MARKS WHEN EXAM CHANGES
   * =========================================================
   */

  useEffect(() => {
    if (!loading && selectedExam) {
      loadMarks(selectedExam)
    }
  }, [
    selectedExam,
    loading,
  ])

  /*
   * =========================================================
   * CLASSES
   * =========================================================
   */

  const classes = useMemo(() => {
    return [...schoolClasses].sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        )
    )
  }, [schoolClasses])

  function getStudentClassName(
    student: Student
  ) {
    if (student.className) {
      return student.className
    }

    if (
      student.classId != null
    ) {
      const found =
        schoolClasses.find(
          (item) =>
            item.id ===
            student.classId
        )

      if (found) {
        return found.name
      }
    }

    return ""
  }

  /*
   * =========================================================
   * STUDENTS IN SELECTED CLASS
   * =========================================================
   */

  const classStudents = useMemo(() => {
    if (!selectedClass) {
      return []
    }

    const selectedClassObject =
      schoolClasses.find(
        (item) =>
          String(item.id) ===
          selectedClass
      )

    if (!selectedClassObject) {
      return []
    }

    const selectedClassName =
      normalize(
        selectedClassObject.name
      )

    return students
      .filter((student) => {
        const status =
          normalize(
            student.status
          )

        if (
          status &&
          status !== "active" &&
          status !== "current"
        ) {
          return false
        }

        const studentClassName =
          normalize(
            getStudentClassName(
              student
            )
          )

        return (
          studentClassName ===
          selectedClassName
        )
      })
      .sort((a, b) => {
        const nameA =
          `${a.firstName} ${
            a.lastName ?? ""
          }`

        const nameB =
          `${b.firstName} ${
            b.lastName ?? ""
          }`

        return nameA.localeCompare(
          nameB
        )
      })
  }, [
    students,
    schoolClasses,
    selectedClass,
  ])

  /*
   * =========================================================
   * CURRENT TEACHER
   * =========================================================
   */

  const currentTeacher =
    useMemo(() => {
      if (
        !isTeacher ||
        !currentUser
      ) {
        return null
      }

      const userEmail =
        normalize(
          (currentUser as any)
            ?.email
        )

      const userName =
        normalize(
          (currentUser as any)
            ?.name ??
            (currentUser as any)
              ?.fullName ??
            ""
        )

      return (
        teachers.find(
          (teacher) => {
            const teacherEmail =
              normalize(
                teacher.email
              )

            const teacherName =
              normalize(
                teacher.name ??
                  `${teacher.firstName ?? ""} ${
                    teacher.lastName ?? ""
                  }`
              )

            return (
              (userEmail &&
                teacherEmail &&
                userEmail ===
                  teacherEmail) ||
              (userName &&
                teacherName &&
                userName ===
                  teacherName)
            )
          }
        ) ?? null
      )
    }, [
      isTeacher,
      currentUser,
      teachers,
    ])

  /*
   * =========================================================
   * AVAILABLE SUBJECTS
   * =========================================================
   */

  const availableSubjects =
    useMemo(() => {
      if (!selectedClass) {
        return []
      }

      const selectedClassObject =
        schoolClasses.find(
          (item) =>
            String(item.id) ===
            selectedClass
        )

      if (!selectedClassObject) {
        return []
      }

      if (isTeacher) {
        if (!currentTeacher) {
          return []
        }

        const assignedSubjectIds =
          new Set(
            assignments
              .filter(
                (assignment) =>
                  assignment.teacher_id ===
                    currentTeacher.id &&
                  String(
                    assignment.class_id
                  ) ===
                    selectedClass
              )
              .map(
                (assignment) =>
                  assignment.subject_id
              )
          )

        return subjects.filter(
          (subject) =>
            assignedSubjectIds.has(
              subject.id
            )
        )
      }

      const className =
        normalize(
          selectedClassObject.name
        )

      const isJuniorSchool =
        className.includes(
          "grade 7"
        ) ||
        className.includes(
          "grade 8"
        ) ||
        className.includes(
          "grade 9"
        ) ||
        className.includes(
          "junior"
        )

      if (isJuniorSchool) {
        const juniorSubjects =
          subjects.filter(
            (subject) =>
              normalize(
                subject.category
              ) ===
                "junior school" ||
              normalize(
                subject.category
              ) === "junior"
          )

        if (
          juniorSubjects.length > 0
        ) {
          return juniorSubjects
        }
      }

      return subjects
    }, [
      selectedClass,
      schoolClasses,
      isTeacher,
      currentTeacher,
      assignments,
      subjects,
    ])

  /*
   * =========================================================
   * RESET SUBJECT WHEN CLASS CHANGES
   * =========================================================
   */

  useEffect(() => {
    setSelectedSubject("")
    setScores({})
  }, [selectedClass])

  /*
   * =========================================================
   * KEEP SUBJECT VALID
   * =========================================================
   */

  useEffect(() => {
    if (
      selectedSubject &&
      !availableSubjects.some(
        (subject) =>
          String(subject.id) ===
          selectedSubject
      )
    ) {
      setSelectedSubject("")
      setScores({})
    }
  }, [
    selectedSubject,
    availableSubjects,
  ])

  /*
   * =========================================================
   * SELECTED SUBJECT / EXAM
   * =========================================================
   */

  const selectedSubjectObject =
    useMemo(() => {
      return subjects.find(
        (subject) =>
          String(subject.id) ===
          selectedSubject
      )
    }, [
      subjects,
      selectedSubject,
    ])

  const selectedExamObject =
    useMemo(() => {
      return exams.find(
        (exam) =>
          String(exam.id) ===
          selectedExam
      )
    }, [
      exams,
      selectedExam,
    ])

  /*
   * =========================================================
   * FAST MARK MAP
   * =========================================================
   */

  const markMap = useMemo(() => {
    const map =
      new Map<string, Mark>()

    for (const mark of marks) {
      map.set(
        `${mark.examId}-${mark.studentId}-${mark.subjectId}`,
        mark
      )
    }

    return map
  }, [marks])

  function scoreKey(
    studentId: number,
    subjectId: number
  ) {
    return `${studentId}-${subjectId}`
  }

  function markLookupKey(
    examId: number,
    studentId: number,
    subjectId: number
  ) {
    return `${examId}-${studentId}-${subjectId}`
  }

  /*
   * =========================================================
   * LOAD EXISTING SUBJECT SCORES
   * =========================================================
   */

  useEffect(() => {
    if (
      !selectedClass ||
      !selectedExam ||
      !selectedSubject ||
      classStudents.length === 0
    ) {
      setScores({})
      return
    }

    const nextScores:
      Record<string, number | ""> =
      {}

    for (
      const student of classStudents
    ) {
      const existingMark =
        markMap.get(
          markLookupKey(
            Number(selectedExam),
            student.id,
            Number(selectedSubject)
          )
        )

      nextScores[
        scoreKey(
          student.id,
          Number(selectedSubject)
        )
      ] =
        existingMark
          ? existingMark.score
          : ""
    }

    setScores(nextScores)
  }, [
    selectedClass,
    selectedExam,
    selectedSubject,
    classStudents,
    markMap,
  ])

  /*
   * =========================================================
   * UPDATE SCORE
   * =========================================================
   */

  function updateScore(
    studentId: number,
    value: string
  ) {
    const key =
      scoreKey(
        studentId,
        Number(selectedSubject)
      )

    if (value === "") {
      setScores(
        (previous) => ({
          ...previous,
          [key]: "",
        })
      )

      return
    }

    let numericValue =
      Number(value)

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return
    }

    numericValue =
      Math.max(
        0,
        Math.min(
          100,
          numericValue
        )
      )

    setScores(
      (previous) => ({
        ...previous,
        [key]:
          numericValue,
      })
    )
  }

  /*
   * =========================================================
   * SAVE MARKS
   * =========================================================
   */

  async function saveMarks() {
    if (!selectedClass) {
      setMessage(
        "Please select a class."
      )

      setMessageType("error")
      return
    }

    if (!selectedExam) {
      setMessage(
        "Please select an exam."
      )

      setMessageType("error")
      return
    }

    if (!selectedSubject) {
      setMessage(
        "Please select a subject."
      )

      setMessageType("error")
      return
    }

    if (
      classStudents.length === 0
    ) {
      setMessage(
        "There are no students in the selected class."
      )

      setMessageType("error")
      return
    }

    const entries =
      classStudents
        .map((student) => {
          const value =
            scores[
              scoreKey(
                student.id,
                Number(
                  selectedSubject
                )
              )
            ]

          if (
            value === "" ||
            value === undefined
          ) {
            return null
          }

          return {
            studentId:
              student.id,

            subjectId:
              Number(
                selectedSubject
              ),

            score:
              Number(value),
          }
        })
        .filter(
          (
            entry
          ): entry is {
            studentId: number
            subjectId: number
            score: number
          } =>
            entry !== null
        )

    if (
      entries.length === 0
    ) {
      setMessage(
        "Please enter at least one mark."
      )

      setMessageType("error")
      return
    }

    try {
      setSaving(true)
      setMessage("")

      const response =
        await fetch(
          "/api/marks",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              examId:
                Number(
                  selectedExam
                ),

              marks:
                entries,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to save marks"
        )
      }

      setMessage(
        `${entries.length} mark${
          entries.length === 1
            ? ""
            : "s"
        } saved successfully.`
      )

      setMessageType("success")

      await loadMarks(
        selectedExam
      )
    } catch (error) {
      console.error(
        "Failed to save marks:",
        error
      )

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

  /*
   * =========================================================
   * DOWNLOAD SUBJECT MARKS
   * =========================================================
   */

  function downloadClassMarks() {
    if (
      !selectedClass ||
      !selectedExam ||
      !selectedSubject
    ) {
      return
    }

    const selectedClassObject =
      schoolClasses.find(
        (item) =>
          String(item.id) ===
          selectedClass
      )

    const selectedSubjectObject =
      subjects.find(
        (item) =>
          String(item.id) ===
          selectedSubject
      )

    const selectedExamObject =
      exams.find(
        (item) =>
          String(item.id) ===
          selectedExam
      )

    if (
      !selectedClassObject ||
      !selectedSubjectObject ||
      !selectedExamObject
    ) {
      return
    }

    const header = [
      "Admission No",
      "Student Name",
      "Class",
      "Exam",
      "Term",
      "Year",
      "Subject",
      "Marks",
    ]

    const rows =
      classStudents.map(
        (student) => {
          const mark =
            markMap.get(
              markLookupKey(
                Number(
                  selectedExam
                ),
                student.id,
                Number(
                  selectedSubject
                )
              )
            )

          const studentName =
            `${student.firstName} ${
              student.middleName ??
              ""
            } ${
              student.lastName ??
              ""
            }`
              .replace(
                /\s+/g,
                " "
              )
              .trim()

          return [
            student.admissionNo,
            studentName,
            selectedClassObject.name,
            selectedExamObject.name,
            selectedExamObject.term ??
              "",
            selectedExamObject.year ??
              "",
            selectedSubjectObject.name,
            mark?.score ?? "",
          ]
        }
      )

    const csv =
      [
        header,
        ...rows,
      ]
        .map((row) =>
          row
            .map((value) => {
              const text =
                String(
                  value ?? ""
                )

              return `"${text.replace(
                /"/g,
                '""'
              )}"`
            })
            .join(",")
        )
        .join("\n")

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      )

    const url =
      URL.createObjectURL(
        blob
      )

    const link =
      document.createElement(
        "a"
      )

    link.href = url

    link.download =
      `${selectedClassObject.name}-${selectedExamObject.name}-${selectedSubjectObject.name}-marks.csv`
        .replace(
          /[^\w.-]+/g,
          "_"
        )

    document.body.appendChild(
      link
    )

    link.click()

    link.remove()

    URL.revokeObjectURL(url)
  }

  /*
   * =========================================================
   * RESULT SUBJECTS
   * =========================================================
   */

  const resultSubjects =
    useMemo(() => {
      if (!selectedClass) {
        return []
      }

      const selectedClassObject =
        schoolClasses.find(
          (item) =>
            String(item.id) ===
            selectedClass
        )

      if (!selectedClassObject) {
        return []
      }

      const className =
        normalize(
          selectedClassObject.name
        )

      const isJuniorSchool =
        className.includes(
          "grade 7"
        ) ||
        className.includes(
          "grade 8"
        ) ||
        className.includes(
          "grade 9"
        ) ||
        className.includes(
          "junior"
        )

      if (isJuniorSchool) {
        const juniorSubjects =
          subjects
            .filter(
              (subject) =>
                normalize(
                  subject.category
                ) ===
                  "junior school" ||
                normalize(
                  subject.category
                ) === "junior"
            )
            .sort(
              (a, b) =>
                a.id - b.id
            )

        if (
          juniorSubjects.length >
          0
        ) {
          return juniorSubjects
        }
      }

      return [...subjects].sort(
        (a, b) =>
          a.id - b.id
      )
    }, [
      selectedClass,
      schoolClasses,
      subjects,
    ])

  /*
   * =========================================================
   * PAST RESULTS
   * =========================================================
   */

  const resultRows =
    useMemo<ResultRow[]>(() => {
      if (
        !selectedClass ||
        !selectedExam ||
        resultSubjects.length ===
          0
      ) {
        return []
      }

      const examNumber =
        Number(selectedExam)

      const rows =
        classStudents.map(
          (student) => {
            const subjectScores:
              Record<
                number,
                number | null
              > = {}

            let total = 0

            let completedSubjects =
              0

            for (
              const subject of resultSubjects
            ) {
              const existingMark =
                markMap.get(
                  markLookupKey(
                    examNumber,
                    student.id,
                    subject.id
                  )
                )

              if (
                existingMark
              ) {
                subjectScores[
                  subject.id
                ] =
                  existingMark.score

                total += Number(
                  existingMark.score
                )

                completedSubjects++
              } else {
                subjectScores[
                  subject.id
                ] = null
              }
            }

            return {
              student,
              subjectScores,
              total,
              completedSubjects,
              position: null,
            }
          }
        )

      /*
       * Only complete learners receive
       * an academic position.
       */

      const completeRows =
        rows
          .filter(
            (row) =>
              row.completedSubjects ===
              resultSubjects.length
          )
          .sort(
            (a, b) =>
              b.total - a.total
          )

      let previousTotal:
        number | null = null

      let previousPosition = 0

      completeRows.forEach(
        (row, index) => {
          if (
            previousTotal ===
              null ||
            row.total !==
              previousTotal
          ) {
            previousPosition =
              index + 1
          }

          row.position =
            previousPosition

          previousTotal =
            row.total
        }
      )

      const positionMap =
        new Map<
          number,
          number
        >()

      completeRows.forEach(
        (row) => {
          if (
            row.position !==
            null
          ) {
            positionMap.set(
              row.student.id,
              row.position
            )
          }
        }
      )

      return rows
        .map((row) => ({
          ...row,
          position:
            positionMap.get(
              row.student.id
            ) ?? null,
        }))
        .sort((a, b) => {
          if (
            a.position !==
              null &&
            b.position !==
              null
          ) {
            return (
              a.position -
              b.position
            )
          }

          if (
            a.position !==
              null &&
            b.position ===
              null
          ) {
            return -1
          }

          if (
            a.position ===
              null &&
            b.position !==
              null
          ) {
            return 1
          }

          return (
            a.student.firstName.localeCompare(
              b.student.firstName
            )
          )
        })
    }, [
      selectedClass,
      selectedExam,
      classStudents,
      resultSubjects,
      markMap,
    ])

  /*
   * =========================================================
   * DOWNLOAD RESULTS
   * =========================================================
   */

  function downloadResults() {
    if (
      !selectedClass ||
      !selectedExam ||
      resultSubjects.length ===
        0 ||
      resultRows.length === 0
    ) {
      return
    }

    const selectedClassObject =
      schoolClasses.find(
        (item) =>
          String(item.id) ===
          selectedClass
      )

    const selectedExamObject =
      exams.find(
        (item) =>
          String(item.id) ===
          selectedExam
      )

    if (
      !selectedClassObject ||
      !selectedExamObject
    ) {
      return
    }

    const header = [
      "Position",
      "Admission No",
      "Student Name",

      ...resultSubjects.map(
        (subject) =>
          subject.name
      ),

      "Total",
      "Subjects Completed",
    ]

    const rows =
      resultRows.map(
        (row) => {
          const studentName =
            `${row.student.firstName} ${
              row.student.middleName ??
              ""
            } ${
              row.student.lastName ??
              ""
            }`
              .replace(
                /\s+/g,
                " "
              )
              .trim()

          return [
            row.position ?? "",
            row.student.admissionNo,
            studentName,

            ...resultSubjects.map(
              (subject) =>
                row.subjectScores[
                  subject.id
                ] ?? ""
            ),

            row.total,
            row.completedSubjects,
          ]
        }
      )

    const csv =
      [
        header,
        ...rows,
      ]
        .map((row) =>
          row
            .map((value) => {
              const text =
                String(
                  value ?? ""
                )

              return `"${text.replace(
                /"/g,
                '""'
              )}"`
            })
            .join(",")
        )
        .join("\n")

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      )

    const url =
      URL.createObjectURL(
        blob
      )

    const link =
      document.createElement(
        "a"
      )

    link.href = url

    link.download =
      `${selectedClassObject.name}-${selectedExamObject.name}-results.csv`
        .replace(
          /[^\w.-]+/g,
          "_"
        )

    document.body.appendChild(
      link
    )

    link.click()

    link.remove()

    URL.revokeObjectURL(url)
  }

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  async function refreshPage() {
    await loadData()

    if (selectedExam) {
      await loadMarks(
        selectedExam
      )
    }
  }

  const canSaveMarks =
    isAdmin || isTeacher

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marks Entry"
        description="Enter, update and review learner examination marks."
      />

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading marks data...
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* =================================================
              MARKS SELECTION
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>
                Marks Selection
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Class
                  </label>

                  <select
                    value={
                      selectedClass
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedClass(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map(
                      (
                        schoolClass
                      ) => (
                        <option
                          key={
                            schoolClass.id
                          }
                          value={
                            schoolClass.id
                          }
                        >
                          {
                            schoolClass.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Exam
                  </label>

                  <select
                    value={
                      selectedExam
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedExam(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select exam
                    </option>

                    {exams.map(
                      (exam) => (
                        <option
                          key={
                            exam.id
                          }
                          value={
                            exam.id
                          }
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

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Subject
                  </label>

                  <select
                    value={
                      selectedSubject
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedSubject(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      !selectedClass
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">
                      Select subject
                    </option>

                    {availableSubjects.map(
                      (subject) => (
                        <option
                          key={
                            subject.id
                          }
                          value={
                            subject.id
                          }
                        >
                          {
                            subject.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      refreshPage
                    }
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {isTeacher &&
                selectedClass &&
                !currentTeacher && (
                  <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                    Your teacher account
                    could not be matched
                    to a teacher record.
                  </div>
                )}

              {isTeacher &&
                selectedClass &&
                currentTeacher &&
                availableSubjects.length ===
                  0 && (
                  <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                    No subjects are
                    assigned to you for
                    this class.
                  </div>
                )}
            </CardContent>
          </Card>

          {/* =================================================
              CLASS STATS
          ================================================= */}

          {selectedClass && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Selected Class
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      schoolClasses.find(
                        (item) =>
                          String(
                            item.id
                          ) ===
                          selectedClass
                      )?.name
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Students
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      classStudents.length
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Available Subjects
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      availableSubjects.length
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Selected Subject
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {
                      selectedSubjectObject?.name ??
                      "None"
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* =================================================
              MARKS ENTRY
          ================================================= */}

          {selectedClass &&
            selectedExam &&
            selectedSubject && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>
                        Marks Entry
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {
                          selectedSubjectObject?.name
                        }{" "}
                        •{" "}
                        {
                          selectedExamObject?.name
                        }{" "}
                        {selectedExamObject?.term
                          ? `• ${selectedExamObject.term}`
                          : ""}

                        {selectedExamObject?.year
                          ? ` • ${selectedExamObject.year}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          downloadClassMarks
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Marks
                      </Button>

                      {canSaveMarks && (
                        <Button
                          type="button"
                          onClick={
                            saveMarks
                          }
                          disabled={
                            saving ||
                            marksLoading
                          }
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save All Marks"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {message && (
                    <div
                      className={`mb-4 flex items-center gap-2 rounded-md border p-3 text-sm ${
                        messageType ===
                        "success"
                          ? "border-green-300 bg-green-50 text-green-800"
                          : "border-red-300 bg-red-50 text-red-800"
                      }`}
                    >
                      {messageType ===
                      "success" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}

                      {message}
                    </div>
                  )}

                  {marksLoading ? (
                    <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading marks for
                        this exam...
                      </div>
                    </div>
                  ) : classStudents.length ===
                    0 ? (
                    <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                      No students found
                      in this class.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">
                              #
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Admission No
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Learner
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Marks
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
                                  student.id,
                                  Number(
                                    selectedSubject
                                  )
                                )

                              const value =
                                scores[
                                  key
                                ] ?? ""

                              return (
                                <tr
                                  key={
                                    student.id
                                  }
                                  className="border-t"
                                >
                                  <td className="px-4 py-3">
                                    {
                                      index +
                                      1
                                    }
                                  </td>

                                  <td className="px-4 py-3 font-medium">
                                    {
                                      student.admissionNo
                                    }
                                  </td>

                                  <td className="px-4 py-3">
                                    {`${student.firstName} ${
                                      student.middleName ??
                                      ""
                                    } ${
                                      student.lastName ??
                                      ""
                                    }`
                                      .replace(
                                        /\s+/g,
                                        " "
                                      )
                                      .trim()}
                                  </td>

                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={
                                        value
                                      }
                                      disabled={
                                        !canSaveMarks ||
                                        marksLoading
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateScore(
                                          student.id,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      aria-label={`${selectedSubjectObject?.name} mark for ${student.firstName} ${student.lastName ?? ""}`}
                                      className="w-28 rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  </td>
                                </tr>
                              )
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* =================================================
              PAST RESULTS
          ================================================= */}

          {isAdmin &&
            selectedClass &&
            selectedExam && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>
                        Past Results / Results Summary
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {
                          schoolClasses.find(
                            (item) =>
                              String(
                                item.id
                              ) ===
                              selectedClass
                          )?.name
                        }{" "}
                        •{" "}
                        {
                          selectedExamObject?.name
                        }{" "}
                        {selectedExamObject?.term
                          ? `• ${selectedExamObject.term}`
                          : ""}

                        {selectedExamObject?.year
                          ? ` • ${selectedExamObject.year}`
                          : ""}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={
                        downloadResults
                      }
                      disabled={
                        resultRows.length ===
                        0
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Results
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* DATABASE DIAGNOSTIC */}

                  <div className="mb-4 rounded-md border bg-muted/30 p-3 text-sm">
                    <div className="grid gap-2 md:grid-cols-5">
                      <div>
                        <span className="text-muted-foreground">
                          Role:
                        </span>{" "}
                        <strong>
                          {normalizedRole ||
                            "unknown"}
                        </strong>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Learners:
                        </span>{" "}
                        <strong>
                          {
                            classStudents.length
                          }
                        </strong>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Marks loaded:
                        </span>{" "}
                        <strong>
                          {
                            marks.length
                          }
                        </strong>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Subjects:
                        </span>{" "}
                        <strong>
                          {
                            resultSubjects.length
                          }
                        </strong>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          Complete:
                        </span>{" "}
                        <strong>
                          {
                            resultRows.filter(
                              (
                                row
                              ) =>
                                row.completedSubjects ===
                                resultSubjects.length
                            ).length
                          }
                        </strong>
                      </div>
                    </div>
                  </div>

                  {marksLoading ? (
                    <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading past
                        results...
                      </div>
                    </div>
                  ) : resultRows.length ===
                    0 ? (
                    <div className="rounded-md border p-8 text-center">
                      <p className="font-medium">
                        No past results found
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Exam:{" "}
                        {
                          selectedExamObject?.name
                        }

                        {selectedExamObject?.term
                          ? ` • ${selectedExamObject.term}`
                          : ""}

                        {selectedExamObject?.year
                          ? ` • ${selectedExamObject.year}`
                          : ""}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Marks loaded from
                        database:{" "}
                        {
                          marks.length
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* RESULT STATISTICS */}

                      <div className="mb-4 grid gap-4 md:grid-cols-4">
                        <div className="rounded-md border p-4">
                          <p className="text-sm text-muted-foreground">
                            Learners
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {
                              resultRows.length
                            }
                          </p>
                        </div>

                        <div className="rounded-md border p-4">
                          <p className="text-sm text-muted-foreground">
                            Subjects
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {
                              resultSubjects.length
                            }
                          </p>
                        </div>

                        <div className="rounded-md border p-4">
                          <p className="text-sm text-muted-foreground">
                            Complete Results
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {
                              resultRows.filter(
                                (
                                  row
                                ) =>
                                  row.completedSubjects ===
                                  resultSubjects.length
                              ).length
                            }
                          </p>
                        </div>

                        <div className="rounded-md border p-4">
                          <p className="text-sm text-muted-foreground">
                            Highest Total
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {resultRows.length >
                            0
                              ? Math.max(
                                  ...resultRows.map(
                                    (
                                      row
                                    ) =>
                                      row.total
                                  )
                                )
                              : 0}
                          </p>
                        </div>
                      </div>

                      {/* RESULT TABLE */}

                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[1250px] text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-3 text-left font-medium">
                                Pos
                              </th>

                              <th className="px-3 py-3 text-left font-medium">
                                Admission No
                              </th>

                              <th className="sticky left-[55px] z-10 bg-muted/50 px-3 py-3 text-left font-medium">
                                Learner
                              </th>

                              {resultSubjects.map(
                                (
                                  subject
                                ) => (
                                  <th
                                    key={
                                      subject.id
                                    }
                                    className="px-3 py-3 text-center font-medium"
                                  >
                                    <div>
                                      {subject.code ??
                                        subject.name}
                                    </div>

                                    {subject.code && (
                                      <div className="text-xs font-normal text-muted-foreground">
                                        {
                                          subject.name
                                        }
                                      </div>
                                    )}
                                  </th>
                                )
                              )}

                              <th className="px-3 py-3 text-center font-bold">
                                Total
                              </th>

                              <th className="px-3 py-3 text-center font-medium">
                                Complete
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {resultRows.map(
                              (
                                row
                              ) => {
                                const studentName =
                                  `${row.student.firstName} ${
                                    row.student.middleName ??
                                    ""
                                  } ${
                                    row.student.lastName ??
                                    ""
                                  }`
                                    .replace(
                                      /\s+/g,
                                      " "
                                    )
                                    .trim()

                                return (
                                  <tr
                                    key={
                                      row.student
                                        .id
                                    }
                                    className="border-t"
                                  >
                                    <td className="sticky left-0 z-10 bg-background px-3 py-3 font-bold">
                                      {row.position ??
                                        "—"}
                                    </td>

                                    <td className="px-3 py-3 font-medium">
                                      {
                                        row.student
                                          .admissionNo
                                      }
                                    </td>

                                    <td className="sticky left-[55px] z-10 bg-background px-3 py-3 font-medium">
                                      {
                                        studentName
                                      }
                                    </td>

                                    {resultSubjects.map(
                                      (
                                        subject
                                      ) => {
                                        const score =
                                          row
                                            .subjectScores[
                                            subject.id
                                          ]

                                        return (
                                          <td
                                            key={
                                              subject.id
                                            }
                                            className="px-3 py-3 text-center"
                                          >
                                            {score ===
                                            null
                                              ? "—"
                                              : score}
                                          </td>
                                        )
                                      }
                                    )}

                                    <td className="px-3 py-3 text-center font-bold">
                                      {
                                        row.total
                                      }
                                    </td>

                                    <td className="px-3 py-3 text-center">
                                      {row.completedSubjects ===
                                      resultSubjects.length ? (
                                        <span className="inline-flex items-center gap-1 text-green-700">
                                          <CheckCircle className="h-4 w-4" />
                                          Yes
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-yellow-700">
                                          <XCircle className="h-4 w-4" />
                                          No
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              }
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                        <strong>
                          Note:
                        </strong>{" "}
                        Position is calculated
                        only for learners who
                        have marks in every
                        subject for the selected
                        exam. Equal totals receive
                        the same position. Learners
                        without complete results
                        remain unranked.
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

