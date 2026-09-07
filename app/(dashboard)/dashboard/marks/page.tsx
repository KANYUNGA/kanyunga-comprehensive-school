"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"

type Student = {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  classId: string
  stream: string
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
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [marks, setMarks] = useState<Mark[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedExam, setSelectedExam] = useState("")

  const [scores, setScores] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  async function loadData() {
    try {
      setLoading(true)
      setMessage("")

      const [
        studentsResponse,
        subjectsResponse,
        examsResponse,
        marksResponse,
      ] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }),
        fetch("/api/subjects", { cache: "no-store" }),
        fetch("/api/exams", { cache: "no-store" }),
        fetch("/api/marks", { cache: "no-store" }),
      ])

      if (!studentsResponse.ok) {
        throw new Error("Failed to load students")
      }

      const studentsData = await studentsResponse.json()
      const subjectsData = await subjectsResponse.json()
      const examsData = await examsResponse.json()
      const marksData = await marksResponse.json()

      const loadedStudents = Array.isArray(studentsData)
        ? studentsData
        : studentsData.data ?? studentsData.students ?? []

      setStudents(loadedStudents)
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setExams(Array.isArray(examsData) ? examsData : [])
      setMarks(Array.isArray(marksData) ? marksData : [])

      if (
        selectedClass &&
        !loadedStudents.some(
          (student: Student) => student.classId === selectedClass
        )
      ) {
        setSelectedClass("")
        setSelectedSubject("")
      }
    } catch (error) {
      console.error("Failed to load marks data:", error)
      setMessage("Failed to load students and marks data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadData()
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    )

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      )
    }
  }, [])

  const classes = useMemo(() => {
    return Array.from(
      new Set(
        students
          .filter((student) => student.status !== "Inactive")
          .map((student) => student.classId)
          .filter(Boolean)
      )
    )
  }, [students])

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects

    const className = selectedClass.toLowerCase()

    let level = ""

    if (
      className.includes("play") ||
      className.includes("pp1") ||
      className.includes("pp2") ||
      className.includes("pre-primary") ||
      className.includes("pre primary")
    ) {
      level = "Pre-primary"
    } else if (
      className.includes("grade 1") ||
      className.includes("grade 2") ||
      className.includes("grade 3") ||
      className.includes("lower")
    ) {
      level = "Lower Primary"
    } else if (
      className.includes("grade 4") ||
      className.includes("grade 5") ||
      className.includes("grade 6") ||
      className.includes("upper")
    ) {
      level = "Upper Primary"
    } else if (
      className.includes("grade 7") ||
      className.includes("grade 8") ||
      className.includes("grade 9") ||
      className.includes("junior")
    ) {
      level = "Junior School"
    } else {
      level = "Junior School"
    }

    return subjects.filter(
      (subject) => subject.category === level
    )
  }, [subjects, selectedClass])

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return []

    return students.filter(
      (student) =>
        student.classId === selectedClass &&
        student.status !== "Inactive"
    )
  }, [students, selectedClass])

  useEffect(() => {
    if (!selectedExam || !selectedSubject) {
      setScores({})
      return
    }

    const existingScores: Record<string, string> = {}

    marks.forEach((mark) => {
      if (
        String(mark.examId) === String(selectedExam) &&
        String(mark.subjectId) === String(selectedSubject)
      ) {
        existingScores[String(mark.studentId)] =
          String(mark.score)
      }
    })

    setScores(existingScores)
  }, [selectedExam, selectedSubject, marks])

  function updateScore(studentId: string, value: string) {
    if (value === "") {
      setScores((current) => ({
        ...current,
        [studentId]: "",
      }))
      return
    }

    const number = Number(value)

    if (number < 0) value = "0"
    if (number > 100) value = "100"

    setScores((current) => ({
      ...current,
      [studentId]: value,
    }))
  }

  async function saveMarks() {
    if (!selectedExam) {
      setMessage("Please select an exam.")
      return
    }

    if (!selectedSubject) {
      setMessage("Please select a subject.")
      return
    }

    if (filteredStudents.length === 0) {
      setMessage("No students found in this class.")
      return
    }

    const entries = filteredStudents
      .filter(
        (student) =>
          scores[student.id] !== undefined &&
          scores[student.id] !== ""
      )
      .map((student) => ({
        studentId: student.id,
        subjectId: selectedSubject,
        score: Number(scores[student.id]),
      }))

    if (entries.length === 0) {
      setMessage("Enter at least one mark.")
      return
    }

    setSaving(true)
    setMessage("")

    try {
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

      if (!response.ok) {
        setMessage(
          result.error || "Failed to save marks."
        )
        return
      }

      setMessage("Marks saved successfully.")

      const refreshed = await fetch("/api/marks", {
        cache: "no-store",
      })

      const refreshedMarks = await refreshed.json()

      if (Array.isArray(refreshedMarks)) {
        setMarks(refreshedMarks)
      }

      await loadData()
    } catch (error) {
      console.error(error)
      setMessage("Failed to save marks.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enter Marks"
        description="Enter and manage examination marks for students."
      />

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Loading marks entry...
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Marks Entry</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Class
                  </label>

                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value)
                      setSelectedSubject("")
                      setScores({})
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
                    onChange={(e) => {
                      setSelectedExam(e.target.value)
                      setScores({})
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
                        {exam.name} - {exam.term}{" "}
                        {exam.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Subject
                  </label>

                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value)
                    }}
                    className="w-full rounded-md border bg-background p-2"
                    disabled={!selectedClass}
                  >
                    <option value="">
                      {selectedClass
                        ? "Select subject"
                        : "Select class first"}
                    </option>

                    {filteredSubjects.map(
                      (subject) => (
                        <option
                          key={subject.id}
                          value={subject.id}
                        >
                          {subject.name} (
                          {subject.code})
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {selectedClass && (
                <div className="mt-4 rounded-md border p-3 text-sm">
                  <strong>
                    {filteredStudents.length}
                  </strong>{" "}
                  students in this class and{" "}
                  <strong>
                    {filteredSubjects.length}
                  </strong>{" "}
                  subjects available.
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
                    Students —{" "}
                    {
                      subjects.find(
                        (subject) =>
                          String(subject.id) ===
                          String(selectedSubject)
                      )?.name
                    }
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {filteredStudents.length === 0 ? (
                    <p className="text-muted-foreground">
                      No students found in this class.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="p-3">
                                #
                              </th>
                              <th className="p-3">
                                Admission No.
                              </th>
                              <th className="p-3">
                                Student Name
                              </th>
                              <th className="p-3">
                                Stream
                              </th>
                              <th className="p-3">
                                Mark / 100
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredStudents.map(
                              (
                                student,
                                index
                              ) => (
                                <tr
                                  key={student.id}
                                  className="border-b"
                                >
                                  <td className="p-3">
                                    {index + 1}
                                  </td>

                                  <td className="p-3">
                                    {
                                      student.admissionNo
                                    }
                                  </td>

                                  <td className="p-3 font-medium">
                                    {
                                      student.firstName
                                    }{" "}
                                    {
                                      student.lastName
                                    }
                                  </td>

                                  <td className="p-3">
                                    {
                                      student.stream ||
                                      "-"
                                    }
                                  </td>

                                  <td className="p-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={
                                        scores[
                                          student.id
                                        ] ?? ""
                                      }
                                      onChange={(e) =>
                                        updateScore(
                                          student.id,
                                          e.target
                                            .value
                                        )
                                      }
                                      className="w-24 rounded-md border bg-background p-2"
                                    />
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex items-center gap-4">
                        <Button
                          onClick={saveMarks}
                          disabled={saving}
                        >
                          {saving
                            ? "Saving..."
                            : "Save Marks"}
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
