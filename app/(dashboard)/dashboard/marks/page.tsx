
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
  admissionNumber?: string
  admission_number?: string
  firstName?: string
  first_name?: string
  middleName?: string
  middle_name?: string
  lastName?: string
  last_name?: string
  gender?: string
  classId?: number | null
  class_id?: number | null
  className?: string
  class_name?: string
  stream?: string
  status?: string
}

type Subject = {
  id: number
  code?: string
  subjectCode?: string
  subject_code?: string
  name: string
  category?: string
  level?: string
}

type Exam = {
  id: number
  examName?: string
  exam_name?: string
  name?: string
  term?: string
  year?: number
  classId?: number | null
  class_id?: number | null
}

type Mark = {
  id: number
  examId: number
  studentId: number
  subjectId: number
  score: number
}

type SchoolClass = {
  id: number
  className?: string
  class_name?: string
  stream?: string
  classTeacher?: string
  class_teacher?: string
}

type Assignment = {
  id?: number
  teacherId?: number
  teacher_id?: number
  subjectId?: number
  subject_id?: number
  classId?: number
  class_id?: number
}

type Teacher = {
  id: number
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  email?: string
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

function studentName(student: Student): string {
  return [
    student.firstName ?? student.first_name ?? "",
    student.middleName ?? student.middle_name ?? "",
    student.lastName ?? student.last_name ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
}

function admissionNumber(student: Student): string {
  return String(
    student.admissionNumber ??
      student.admission_number ??
      ""
  )
}

function subjectCode(subject: Subject): string {
  return String(
    subject.code ??
      subject.subjectCode ??
      subject.subject_code ??
      ""
  )
}

function examName(exam: Exam): string {
  return String(
    exam.examName ??
      exam.exam_name ??
      exam.name ??
      ""
  )
}

function className(classItem: SchoolClass): string {
  return String(
    classItem.className ??
      classItem.class_name ??
      ""
  )
}

function studentClassName(student: Student): string {
  return String(
    student.className ??
      student.class_name ??
      ""
  )
}

function normalizeRole(role: unknown): string {
  const value = normalize(role)

  if (
    value === "administrator" ||
    value === "admin" ||
    value === "school administrator"
  ) {
    return "admin"
  }

  if (value === "teacher") {
    return "teacher"
  }

  if (value === "parent") {
    return "parent"
  }

  return value
}

export default function MarksPage() {
  const {
    user,
    classes: storeClasses,
  } = useSchool()

  const [students, setStudents] = useState<Student[]>([])
  const [schoolClasses, setSchoolClasses] = useState<
    SchoolClass[]
  >([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [assignments, setAssignments] = useState<
    Assignment[]
  >([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedSubject, setSelectedSubject] =
    useState("")

  const [scores, setScores] = useState<
    Record<number, string>
  >({})

  const [loading, setLoading] = useState(true)
  const [marksLoading, setMarksLoading] =
    useState(false)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("")

  const role = normalizeRole(user?.role)
  const isTeacher = role === "teacher"

  /*
   * =========================================================
   * LOAD PAGE DATA
   * =========================================================
   */

  async function loadData() {
    setLoading(true)
    setMessage("")

    try {
      const [
        studentsResponse,
        classesResponse,
        subjectsResponse,
        examsResponse,
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

      if (!studentsResponse.ok) {
        throw new Error(
          "Failed to load students."
        )
      }

      if (!classesResponse.ok) {
        throw new Error(
          "Failed to load classes."
        )
      }

      if (!subjectsResponse.ok) {
        throw new Error(
          "Failed to load subjects."
        )
      }

      if (!examsResponse.ok) {
        throw new Error(
          "Failed to load examinations."
        )
      }

      const studentsData =
        await studentsResponse.json()

      const classesData =
        await classesResponse.json()

      const subjectsData =
        await subjectsResponse.json()

      const examsData =
        await examsResponse.json()

      const assignmentsData =
        await assignmentsResponse.json()

      const teachersData =
        await teachersResponse.json()

      const loadedStudents =
        Array.isArray(studentsData)
          ? studentsData
          : Array.isArray(
              studentsData?.students
            )
            ? studentsData.students
            : []

      const loadedClasses =
        Array.isArray(classesData)
          ? classesData
          : Array.isArray(
              classesData?.classes
            )
            ? classesData.classes
            : []

      const loadedSubjects =
        Array.isArray(subjectsData)
          ? subjectsData
          : Array.isArray(
              subjectsData?.subjects
            )
            ? subjectsData.subjects
            : []

      const loadedExams =
        Array.isArray(examsData)
          ? examsData
          : Array.isArray(
              examsData?.exams
            )
            ? examsData.exams
            : []

      const loadedAssignments =
        Array.isArray(assignmentsData)
          ? assignmentsData
          : Array.isArray(
              assignmentsData?.assignments
            )
            ? assignmentsData.assignments
            : []

      const loadedTeachers =
        Array.isArray(teachersData)
          ? teachersData
          : Array.isArray(
              teachersData?.teachers
            )
            ? teachersData.teachers
            : []

      setStudents(loadedStudents)
      setSchoolClasses(loadedClasses)
      setSubjects(loadedSubjects)
      setExams(loadedExams)
      setAssignments(loadedAssignments)
      setTeachers(loadedTeachers)

      /*
       * Prefer Grade 7 as the default class.
       */

      if (!selectedClass) {
        const grade7 =
          loadedClasses.find(
            (item: SchoolClass) =>
              normalize(
                className(item)
              ) === "grade 7"
          )

        if (grade7) {
          setSelectedClass(
            String(grade7.id)
          )
        } else if (
          loadedClasses.length > 0
        ) {
          setSelectedClass(
            String(
              loadedClasses[0].id
            )
          )
        }
      }

      /*
       * Prefer the imported historical examination:
       *
       * Mid-Term Exam
       * Term 2
       * 2026
       */

      if (!selectedExam) {
        const historicalExam =
          loadedExams.find(
            (exam: Exam) =>
              normalize(
                examName(exam)
              ).includes("mid-term") &&
              normalize(
                exam.term
              ).includes("term 2") &&
              Number(exam.year) ===
                2026
          )

        if (historicalExam) {
          setSelectedExam(
            String(
              historicalExam.id
            )
          )
        } else {
          const examId2 =
            loadedExams.find(
              (exam: Exam) =>
                Number(exam.id) === 2
            )

          if (examId2) {
            setSelectedExam(
              String(
                examId2.id
              )
            )
          } else if (
            loadedExams.length > 0
          ) {
            setSelectedExam(
              String(
                loadedExams[0].id
              )
            )
          }
        }
      }
    } catch (error) {
      console.error(
        "Failed to load marks page data:",
        error
      )

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load marks page data."
      )

      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  /*
   * =========================================================
   * LOAD MARKS
   * =========================================================
   */

  async function loadMarks() {
    if (!selectedExam) {
      setMarks([])
      return
    }

    setMarksLoading(true)

    try {
      let loadedMarks: Mark[] = []

      let url =
        `/api/marks?examId=${encodeURIComponent(
          selectedExam
        )}`

      if (selectedClass) {
        url +=
          `&classId=${encodeURIComponent(
            selectedClass
          )}`
      }

      const response =
        await fetch(url, {
          cache: "no-store",
        })

      if (!response.ok) {
        throw new Error(
          "Failed to load marks."
        )
      }

      const responseData =
        await response.json()

      if (
        Array.isArray(responseData)
      ) {
        loadedMarks =
          responseData
      } else if (
        Array.isArray(
          responseData?.marks
        )
      ) {
        loadedMarks =
          responseData.marks
      }

      /*
       * =====================================================
       * FALLBACK
       *
       * If class-filtered results are empty, retrieve all
       * marks for the examination and filter locally.
       * =====================================================
       */

      if (
        selectedClass &&
        loadedMarks.length === 0
      ) {
        const allResponse =
          await fetch(
            `/api/marks?examId=${encodeURIComponent(
              selectedExam
            )}`,
            {
              cache: "no-store",
            }
          )

        if (allResponse.ok) {
          const allData =
            await allResponse.json()

          const allMarks: Mark[] =
            Array.isArray(allData)
              ? allData
              : Array.isArray(
                  allData?.marks
                )
                ? allData.marks
                : []

          const selectedClassObject =
            schoolClasses.find(
              (item) =>
                String(item.id) ===
                String(
                  selectedClass
                )
            )

          const selectedClassName =
            selectedClassObject
              ? normalize(
                  className(
                    selectedClassObject
                  )
                )
              : ""

          const classStudentIds =
            new Set(
              students
                .filter(
                  (student) => {
                    const studentClassId =
                      student.classId ??
                      student.class_id ??
                      null

                    const matchesId =
                      studentClassId !==
                        null &&
                      String(
                        studentClassId
                      ) ===
                        String(
                          selectedClass
                        )

                    const matchesName =
                      selectedClassName !==
                        "" &&
                      normalize(
                        studentClassName(
                          student
                        )
                      ) ===
                        selectedClassName

                    return (
                      matchesId ||
                      matchesName
                    )
                  }
                )
                .map(
                  (student) =>
                    Number(student.id)
                )
            )

          loadedMarks =
            allMarks.filter(
              (mark) =>
                classStudentIds.has(
                  Number(
                    mark.studentId
                  )
                )
            )
        }
      }

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
          : "Failed to load examination marks."
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

  useEffect(() => {
    if (
      !loading &&
      selectedExam
    ) {
      loadMarks()
    }
  }, [
    selectedExam,
    selectedClass,
    loading,
  ])

  /*
   * =========================================================
   * CLASSES
   * =========================================================
   */

  const classes = useMemo(() => {
    if (schoolClasses.length > 0) {
      return schoolClasses
    }

    return (
      (storeClasses ??
        []) as SchoolClass[]
    )
  }, [
    schoolClasses,
    storeClasses,
  ])

  /*
   * =========================================================
   * SELECTED CLASS
   * =========================================================
   */

  const selectedClassObject =
    useMemo(() => {
      return classes.find(
        (item) =>
          String(item.id) ===
          String(selectedClass)
      )
    }, [
      classes,
      selectedClass,
    ])

  const selectedClassName =
    selectedClassObject
      ? normalize(
          className(
            selectedClassObject
          )
        )
      : ""

  /*
   * =========================================================
   * STUDENTS IN SELECTED CLASS
   * =========================================================
   */

  const classStudents =
    useMemo(() => {
      if (!selectedClass) {
        return []
      }

      return students
        .filter((student) => {
          /*
           * Do not show inactive learners
           * for mark entry.
           */

          if (
            student.status &&
            normalize(
              student.status
            ) !== "active"
          ) {
            return false
          }

          const studentClassId =
            student.classId ??
            student.class_id ??
            null

          const matchesId =
            studentClassId !== null &&
            String(
              studentClassId
            ) ===
              String(
                selectedClass
              )

          const matchesName =
            selectedClassName !==
              "" &&
            normalize(
              studentClassName(
                student
              )
            ) ===
              selectedClassName

          return (
            matchesId ||
            matchesName
          )
        })
        .sort((a, b) =>
          admissionNumber(
            a
          ).localeCompare(
            admissionNumber(b),
            undefined,
            {
              numeric: true,
            }
          )
        )
    }, [
      students,
      selectedClass,
      selectedClassName,
    ])

  /*
   * =========================================================
   * CURRENT TEACHER
   * =========================================================
   */

  const currentTeacher =
    useMemo(() => {
      if (!isTeacher) {
        return null
      }

      const email =
        normalize(
          user?.email
        )

      if (email) {
        const byEmail =
          teachers.find(
            (teacher) =>
              normalize(
                teacher.email
              ) === email
          )

        if (byEmail) {
          return byEmail
        }
      }

      const userName =
        normalize(
          user?.name
        )

      if (userName) {
        return (
          teachers.find(
            (teacher) => {
              const name =
                normalize(
                  [
                    teacher.firstName ??
                      teacher.first_name ??
                      "",
                    teacher.lastName ??
                      teacher.last_name ??
                      "",
                  ]
                    .filter(
                      Boolean
                    )
                    .join(" ")
                )

              return (
                name === userName
              )
            }
          ) ?? null
        )
      }

      return null
    }, [
      isTeacher,
      user,
      teachers,
    ])

  /*
   * =========================================================
   * TEACHER ASSIGNMENTS
   * =========================================================
   */

  const teacherAssignments =
    useMemo(() => {
      if (!currentTeacher) {
        return []
      }

      return assignments.filter(
        (assignment) => {
          const teacherId =
            assignment.teacherId ??
            assignment.teacher_id

          return (
            teacherId !==
              undefined &&
            String(
              teacherId
            ) ===
              String(
                currentTeacher.id
              )
          )
        }
      )
    }, [
      assignments,
      currentTeacher,
    ])

  /*
   * =========================================================
   * AVAILABLE SUBJECTS
   * =========================================================
   */

  const availableSubjects =
    useMemo(() => {
      if (!selectedClassObject) {
        return []
      }

      const currentClassName =
        normalize(
          className(
            selectedClassObject
          )
        )

      /*
       * Grade 7-9 are Junior School.
       */

      const isJuniorSchool =
        currentClassName.includes(
          "grade 7"
        ) ||
        currentClassName.includes(
          "grade 8"
        ) ||
        currentClassName.includes(
          "grade 9"
        )

      /*
       * Teachers only see subjects assigned
       * to them.
       */

      if (isTeacher) {
        const assignedSubjectIds =
          new Set<number>()

        teacherAssignments.forEach(
          (assignment) => {
            const subjectId =
              assignment.subjectId ??
              assignment.subject_id

            if (
              subjectId !==
              undefined
            ) {
              assignedSubjectIds.add(
                Number(
                  subjectId
                )
              )
            }
          }
        )

        return subjects
          .filter(
            (subject) =>
              assignedSubjectIds.has(
                Number(
                  subject.id
                )
              )
          )
          .sort(
            (a, b) =>
              Number(a.id) -
              Number(b.id)
          )
      }

      /*
       * Junior School subjects.
       */

      if (isJuniorSchool) {
        const juniorSubjects =
          subjects.filter(
            (subject) => {
              const category =
                normalize(
                  subject.category
                )

              const level =
                normalize(
                  subject.level
                )

              return (
                category.includes(
                  "junior"
                ) ||
                level.includes(
                  "junior"
                )
              )
            }
          )

        if (
          juniorSubjects.length >
          0
        ) {
          return juniorSubjects.sort(
            (a, b) =>
              Number(a.id) -
              Number(b.id)
          )
        }

        /*
         * Historical Junior School
         * subject IDs.
         */

        const historicalJuniorIds =
          new Set([
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            41,
            42,
          ])

        return subjects
          .filter(
            (subject) =>
              historicalJuniorIds.has(
                Number(
                  subject.id
                )
              )
          )
          .sort(
            (a, b) =>
              Number(a.id) -
              Number(b.id)
          )
      }

      return [...subjects].sort(
        (a, b) =>
          Number(a.id) -
          Number(b.id)
      )
    }, [
      subjects,
      selectedClassObject,
      isTeacher,
      teacherAssignments,
    ])

  /*
   * =========================================================
   * SELECTED SUBJECT
   * =========================================================
   */

  const selectedSubjectObject =
    useMemo(() => {
      return availableSubjects.find(
        (subject) =>
          String(
            subject.id
          ) ===
          String(
            selectedSubject
          )
      )
    }, [
      availableSubjects,
      selectedSubject,
    ])

  /*
   * =========================================================
   * SELECTED EXAM
   * =========================================================
   */

  const selectedExamObject =
    useMemo(() => {
      return exams.find(
        (exam) =>
          String(exam.id) ===
          String(selectedExam)
      )
    }, [
      exams,
      selectedExam,
    ])

  /*
   * =========================================================
   * MARK MAP
   * =========================================================
   */

  const markMap = useMemo(() => {
    const map = new Map<
      string,
      number
    >()

    marks.forEach((mark) => {
      const key =
        `${mark.examId}-${mark.studentId}-${mark.subjectId}`

      map.set(
        key,
        Number(mark.score)
      )
    })

    return map
  }, [marks])

  /*
   * =========================================================
   * LOAD SELECTED SUBJECT SCORES
   * =========================================================
   */

  useEffect(() => {
    if (
      !selectedExam ||
      !selectedSubject
    ) {
      setScores({})
      return
    }

    const nextScores: Record<
      number,
      string
    > = {}

    classStudents.forEach(
      (student) => {
        const key =
          `${selectedExam}-${student.id}-${selectedSubject}`

        const score =
          markMap.get(key)

        nextScores[student.id] =
          score === undefined
            ? ""
            : String(score)
      }
    )

    setScores(nextScores)
  }, [
    selectedExam,
    selectedSubject,
    classStudents,
    markMap,
  ])

  /*
   * =========================================================
   * SAVE MARKS
   * =========================================================
   */

  async function saveMarks() {
    if (
      !selectedExam ||
      !selectedSubject
    ) {
      setMessage(
        "Please select an exam and subject."
      )

      setMessageType("error")
      return
    }

    if (
      classStudents.length === 0
    ) {
      setMessage(
        "No learners found for the selected class."
      )

      setMessageType("error")
      return
    }

    setSaving(true)
    setMessage("")
    setMessageType("")

    try {
      const entries =
        classStudents
          .map((student) => {
            const rawScore =
              scores[student.id]

            if (
              rawScore ===
                undefined ||
              rawScore === ""
            ) {
              return null
            }

            const score =
              Number(rawScore)

            if (
              Number.isNaN(
                score
              ) ||
              score < 0 ||
              score > 100
            ) {
              throw new Error(
                `Invalid mark for ${studentName(
                  student
                )}. Marks must be between 0 and 100.`
              )
            }

            return {
              studentId:
                Number(
                  student.id
                ),
              subjectId:
                Number(
                  selectedSubject
                ),
              score,
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
          "Enter at least one mark before saving."
        )

        setMessageType("error")
        return
      }

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
              marks: entries,
            }),
          }
        )

      const responseData =
        await response.json()

      if (!response.ok) {
        throw new Error(
          responseData?.error ||
            "Failed to save marks."
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

      await loadMarks()
    } catch (error) {
      console.error(
        "Failed to save marks:",
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

  /*
   * =========================================================
   * DOWNLOAD CURRENT SUBJECT MARKS
   * =========================================================
   */

  function downloadClassMarks() {
    if (
      !selectedClassObject ||
      !selectedExamObject
    ) {
      return
    }

    const subject =
      selectedSubjectObject

    const header = [
      "Admission Number",
      "Learner",
      subject
        ? `${subjectCode(
            subject
          )} - ${subject.name}`
        : "Mark",
    ]

    const rows =
      classStudents.map(
        (student) => {
          const score =
            selectedSubject
              ? markMap.get(
                  `${selectedExam}-${student.id}-${selectedSubject}`
                )
              : undefined

          return [
            admissionNumber(
              student
            ),
            studentName(
              student
            ),
            score ?? "",
          ]
        }
      )

    const csv = [
      header,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(
              value ?? ""
            ).replaceAll(
              '"',
              '""'
            )}"`
          )
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
      `${className(
        selectedClassObject
      )}-${examName(
        selectedExamObject
      )}-${subject
        ? subject.name
        : "marks"
      }.csv`

    document.body.appendChild(
      link
    )

    link.click()

    document.body.removeChild(
      link
    )

    URL.revokeObjectURL(
      url
    )
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marks Entry"
        description="Enter and update individual learner examination marks."
      />

      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {message && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            messageType ===
            "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {messageType ===
            "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}

            <span>
              {message}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          SELECTION
          ===================================================== */}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              Marks Selection
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                loadData()
              }
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* CLASS */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Class
              </label>

              <select
                value={
                  selectedClass
                }
                onChange={(event) => {
                  setSelectedClass(
                    event.target.value
                  )

                  setSelectedSubject(
                    ""
                  )

                  setScores({})
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  Select class
                </option>

                {classes.map(
                  (item) => (
                    <option
                      key={
                        item.id
                      }
                      value={
                        item.id
                      }
                    >
                      {className(
                        item
                      )}

                      {item.stream
                        ? ` - ${item.stream}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* EXAM */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Exam
              </label>

              <select
                value={
                  selectedExam
                }
                onChange={(event) => {
                  setSelectedExam(
                    event.target.value
                  )

                  setSelectedSubject(
                    ""
                  )

                  setScores({})
                }}
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
                      {examName(
                        exam
                      )}
                      {" - "}
                      {exam.term}
                      {" "}
                      {exam.year}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SUBJECT */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Subject
              </label>

              <select
                value={
                  selectedSubject
                }
                onChange={(event) =>
                  setSelectedSubject(
                    event.target.value
                  )
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={
                  availableSubjects.length ===
                  0
                }
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
                      {subject.name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Selected Class
            </div>

            <div className="mt-2 text-2xl font-bold">
              {selectedClassObject
                ? className(
                    selectedClassObject
                  )
                : "None"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Students
            </div>

            <div className="mt-2 text-2xl font-bold">
              {
                classStudents.length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Available Subjects
            </div>

            <div className="mt-2 text-2xl font-bold">
              {
                availableSubjects.length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Selected Subject
            </div>

            <div className="mt-2 text-lg font-bold">
              {selectedSubjectObject
                ? selectedSubjectObject.name
                : "None"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =====================================================
          MARK ENTRY
          ===================================================== */}

      {selectedSubjectObject &&
        selectedExamObject &&
        selectedClassObject && (
          <Card>
            <CardHeader>
              <CardTitle>
                Enter Marks
              </CardTitle>
            </CardHeader>

            <CardContent>
              {marksLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading marks...
                </div>
              ) : classStudents.length ===
                0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No learners found for
                  this class.
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {
                          selectedSubjectObject.name
                        }
                      </span>

                      {" • "}

                      {
                        examName(
                          selectedExamObject
                        )
                      }

                      {" • "}

                      {
                        selectedExamObject.term
                      }

                      {" • "}

                      {
                        selectedExamObject.year
                      }
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={
                        downloadClassMarks
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />

                      Download
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left">
                            #
                          </th>

                          <th className="px-4 py-3 text-left">
                            Admission No.
                          </th>

                          <th className="px-4 py-3 text-left">
                            Learner
                          </th>

                          <th className="px-4 py-3 text-left">
                            Mark
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {classStudents.map(
                          (
                            student,
                            index
                          ) => (
                            <tr
                              key={
                                student.id
                              }
                              className="border-b last:border-0"
                            >
                              <td className="px-4 py-3">
                                {index +
                                  1}
                              </td>

                              <td className="px-4 py-3">
                                {admissionNumber(
                                  student
                                )}
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {studentName(
                                  student
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={
                                    scores[
                                      student.id
                                    ] ??
                                    ""
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setScores(
                                      (
                                        previous
                                      ) => ({
                                        ...previous,
                                        [student.id]:
                                          event
                                            .target
                                            .value,
                                      })
                                    )
                                  }
                                  className="w-24 rounded-md border bg-background px-3 py-2"
                                  aria-label={`${selectedSubjectObject.name} mark for ${studentName(
                                    student
                                  )}`}
                                />
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={
                        saveMarks
                      }
                      disabled={
                        saving
                      }
                    >
                      {saving
                        ? "Saving..."
                        : "Save Marks"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

      {/* =====================================================
          MARKS PAGE NOTE
          ===================================================== */}

      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              Marks Entry:
            </strong>{" "}
            Use this page to enter or update
            individual subject marks.
            Complete examination results,
            totals, positions and historical
            reports are available in the{" "}
            <strong className="text-foreground">
              Examinations
            </strong>{" "}
            tab.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

