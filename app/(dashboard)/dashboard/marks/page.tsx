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

type SchoolClass = {
  id: string
  name: string
  streams: string[]
}

const CLASS_ORDER = [
  "Playgroup",
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
]

export default function MarksPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedExam, setSelectedExam] = useState("")

  const [scores, setScores] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [
          studentsResponse,
          subjectsResponse,
          examsResponse,
          marksResponse,
          classesResponse,
        ] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/subjects"),
          fetch("/api/exams"),
          fetch("/api/marks"),
          fetch("/api/classes"),
        ])

        const studentsData = await studentsResponse.json()
        const subjectsData = await subjectsResponse.json()
        const examsData = await examsResponse.json()
        const marksData = await marksResponse.json()
        const classesData = await classesResponse.json()

        setStudents(
          Array.isArray(studentsData) ? studentsData : []
        )

        setSubjects(
          Array.isArray(subjectsData) ? subjectsData : []
        )

        setExams(
          Array.isArray(examsData) ? examsData : []
        )

        setMarks(
          Array.isArray(marksData) ? marksData : []
        )

        setSchoolClasses(
          Array.isArray(classesData) ? classesData : []
        )
      } catch (error) {
        console.error("Failed to load marks data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const classes = useMemo(() => {
    return CLASS_ORDER
      .map((name) =>
        schoolClasses.find(
          (schoolClass) => schoolClass.name === name
        )
      )
      .filter(Boolean) as SchoolClass[]
  }, [schoolClasses])

  const selectedClassObject = useMemo(() => {
    return schoolClasses.find(
      (schoolClass) => schoolClass.name === selectedClass
    )
  }, [schoolClasses, selectedClass])

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return []

    let level = ""

    if (
      selectedClass === "Playgroup" ||
      selectedClass === "PP1" ||
      selectedClass === "PP2"
    ) {
      level = "Pre-primary"
    } else if (
      selectedClass === "Grade 1" ||
      selectedClass === "Grade 2" ||
      selectedClass === "Grade 3"
    ) {
      level = "Lower Primary"
    } else if (
      selectedClass === "Grade 4" ||
      selectedClass === "Grade 5" ||
      selectedClass === "Grade 6"
    ) {
      level = "Upper Primary"
    } else if (
      selectedClass === "Grade 7" ||
      selectedClass === "Grade 8" ||
      selectedClass === "Grade 9"
    ) {
      level = "Junior School"
    }

    return subjects.filter(
      (subject) => subject.category === level
    )
  }, [subjects, selectedClass])

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return []

    return students.filter(
      (student) => student.classId === selectedClass
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

  function updateScore(
    studentId: string,
    value: string
  ) {
    if (value === "") {
      setScores((current) => ({
        ...current,
        [studentId]: "",
      }))
      return
    }

    let number = Number(value)

    if (number < 0) number = 0
    if (number > 100) number = 100

    setScores((current) => ({
      ...current,
      [studentId]: String(number),
    }))
  }

  async function saveMarks() {
    if (!selectedClass) {
      setMessage("Please select a class.")
      return
    }

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

      const refreshed = await fetch("/api/marks")
      const refreshedMarks = await refreshed.json()

      if (Array.isArray(refreshedMarks)) {
        setMarks(refreshedMarks)
      }
    } catch (error) {
      console.error("Failed to save marks:", error)
      setMessage("Failed to save marks.")
    } finally {
      setSaving(false)
    }
  }

  const selectedSubjectName =
    subjects.find(
      (subject) =>
        String(subject.id) ===
        String(selectedSubject)
    )?.name || ""

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
                      setMessage("")
                    }}
                    className="w-full rounded-md border bg-background p-2"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((schoolClass) => (
                      <option
                        key={schoolClass.id}
                        value={schoolClass.name}
                      >
                        {schoolClass.name}
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
                      setMessage("")
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
                      setMessage("")
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
                          {subject.name} ({subject.code})
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {selectedClass && (
                <div className="mt-4 rounded-md border p-3 text-sm">
                  <strong>{selectedClass}</strong>
                  {" — "}
                  {filteredSubjects.length} subjects
                  available
                  {selectedClassObject?.streams?.length
                    ? ` — Streams: ${selectedClassObject.streams.join(", ")}`
                    : ""}
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
                    {selectedSubjectName}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {filteredStudents.length === 0 ? (
                    <p className="text-muted-foreground">
                      No students found in{" "}
                      {selectedClass}.
                    </p>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-muted-foreground">
                        {filteredStudents.length} student
                        {filteredStudents.length === 1
                          ? ""
                          : "s"}
                      </div>

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
                                  key={
                                    student.id
                                  }
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
                                    {student.stream ||
                                      "-"}
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

                      <div className="mt-6 flex flex-wrap items-center gap-4">
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
      }"use client"

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

type SchoolClass = {
  id: string
  name: string
  streams: string[]
}

const CLASS_ORDER = [
  "Playgroup",
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
]

export default function MarksPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedExam, setSelectedExam] = useState("")

  const [scores, setScores] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [
          studentsResponse,
          subjectsResponse,
          examsResponse,
          marksResponse,
          classesResponse,
        ] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/subjects"),
          fetch("/api/exams"),
          fetch("/api/marks"),
          fetch("/api/classes"),
        ])

        const studentsData = await studentsResponse.json()
        const subjectsData = await subjectsResponse.json()
        const examsData = await examsResponse.json()
        const marksData = await marksResponse.json()
        const classesData = await classesResponse.json()

        setStudents(
          Array.isArray(studentsData) ? studentsData : []
        )

        setSubjects(
          Array.isArray(subjectsData) ? subjectsData : []
        )

        setExams(
          Array.isArray(examsData) ? examsData : []
        )

        setMarks(
          Array.isArray(marksData) ? marksData : []
        )

        setSchoolClasses(
          Array.isArray(classesData) ? classesData : []
        )
      } catch (error) {
        console.error("Failed to load marks data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const classes = useMemo(() => {
    return CLASS_ORDER
      .map((name) =>
        schoolClasses.find(
          (schoolClass) => schoolClass.name === name
        )
      )
      .filter(Boolean) as SchoolClass[]
  }, [schoolClasses])

  const selectedClassObject = useMemo(() => {
    return schoolClasses.find(
      (schoolClass) => schoolClass.name === selectedClass
    )
  }, [schoolClasses, selectedClass])

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return []

    let level = ""

    if (
      selectedClass === "Playgroup" ||
      selectedClass === "PP1" ||
      selectedClass === "PP2"
    ) {
      level = "Pre-primary"
    } else if (
      selectedClass === "Grade 1" ||
      selectedClass === "Grade 2" ||
      selectedClass === "Grade 3"
    ) {
      level = "Lower Primary"
    } else if (
      selectedClass === "Grade 4" ||
      selectedClass === "Grade 5" ||
      selectedClass === "Grade 6"
    ) {
      level = "Upper Primary"
    } else if (
      selectedClass === "Grade 7" ||
      selectedClass === "Grade 8" ||
      selectedClass === "Grade 9"
    ) {
      level = "Junior School"
    }

    return subjects.filter(
      (subject) => subject.category === level
    )
  }, [subjects, selectedClass])

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return []

    return students.filter(
      (student) => student.classId === selectedClass
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

  function updateScore(
    studentId: string,
    value: string
  ) {
    if (value === "") {
      setScores((current) => ({
        ...current,
        [studentId]: "",
      }))
      return
    }

    let number = Number(value)

    if (number < 0) number = 0
    if (number > 100) number = 100

    setScores((current) => ({
      ...current,
      [studentId]: String(number),
    }))
  }

  async function saveMarks() {
    if (!selectedClass) {
      setMessage("Please select a class.")
      return
    }

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

      const refreshed = await fetch("/api/marks")
      const refreshedMarks = await refreshed.json()

      if (Array.isArray(refreshedMarks)) {
        setMarks(refreshedMarks)
      }
    } catch (error) {
      console.error("Failed to save marks:", error)
      setMessage("Failed to save marks.")
    } finally {
      setSaving(false)
    }
  }

  const selectedSubjectName =
    subjects.find(
      (subject) =>
        String(subject.id) ===
        String(selectedSubject)
    )?.name || ""

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
                      setMessage("")
                    }}
                    className="w-full rounded-md border bg-background p-2"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((schoolClass) => (
                      <option
                        key={schoolClass.id}
                        value={schoolClass.name}
                      >
                        {schoolClass.name}
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
                      setMessage("")
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
                      setMessage("")
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
                          {subject.name} ({subject.code})
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {selectedClass && (
                <div className="mt-4 rounded-md border p-3 text-sm">
                  <strong>{selectedClass}</strong>
                  {" — "}
                  {filteredSubjects.length} subjects
                  available
                  {selectedClassObject?.streams?.length
                    ? ` — Streams: ${selectedClassObject.streams.join(", ")}`
                    : ""}
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
                    {selectedSubjectName}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {filteredStudents.length === 0 ? (
                    <p className="text-muted-foreground">
                      No students found in{" "}
                      {selectedClass}.
                    </p>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-muted-foreground">
                        {filteredStudents.length} student
                        {filteredStudents.length === 1
                          ? ""
                          : "s"}
                      </div>

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
                                  key={
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

type SchoolClass = {
  id: string
  name: string
  streams: string[]
}

const CLASS_ORDER = [
  "Playgroup",
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
]

export default function MarksPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedExam, setSelectedExam] = useState("")

  const [scores, setScores] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [
          studentsResponse,
          subjectsResponse,
          examsResponse,
          marksResponse,
          classesResponse,
        ] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/subjects"),
          fetch("/api/exams"),
          fetch("/api/marks"),
          fetch("/api/classes"),
        ])

        const studentsData = await studentsResponse.json()
        const subjectsData = await subjectsResponse.json()
        const examsData = await examsResponse.json()
        const marksData = await marksResponse.json()
        const classesData = await classesResponse.json()

        setStudents(
          Array.isArray(studentsData) ? studentsData : []
        )

        setSubjects(
          Array.isArray(subjectsData) ? subjectsData : []
        )

        setExams(
          Array.isArray(examsData) ? examsData : []
        )

        setMarks(
          Array.isArray(marksData) ? marksData : []
        )

        setSchoolClasses(
          Array.isArray(classesData) ? classesData : []
        )
      } catch (error) {
        console.error("Failed to load marks data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const classes = useMemo(() => {
    return CLASS_ORDER
      .map((name) =>
        schoolClasses.find(
          (schoolClass) => schoolClass.name === name
        )
      )
      .filter(Boolean) as SchoolClass[]
  }, [schoolClasses])

  const selectedClassObject = useMemo(() => {
    return schoolClasses.find(
      (schoolClass) => schoolClass.name === selectedClass
    )
  }, [schoolClasses, selectedClass])

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return []

    let level = ""

    if (
      selectedClass === "Playgroup" ||
      selectedClass === "PP1" ||
      selectedClass === "PP2"
    ) {
      level = "Pre-primary"
    } else if (
      selectedClass === "Grade 1" ||
      selectedClass === "Grade 2" ||
      selectedClass === "Grade 3"
    ) {
      level = "Lower Primary"
    } else if (
      selectedClass === "Grade 4" ||
      selectedClass === "Grade 5" ||
      selectedClass === "Grade 6"
    ) {
      level = "Upper Primary"
    } else if (
      selectedClass === "Grade 7" ||
      selectedClass === "Grade 8" ||
      selectedClass === "Grade 9"
    ) {
      level = "Junior School"
    }

    return subjects.filter(
      (subject) => subject.category === level
    )
  }, [subjects, selectedClass])

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return []

    return students.filter(
      (student) => student.classId === selectedClass
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

  function updateScore(
    studentId: string,
    value: string
  ) {
    if (value === "") {
      setScores((current) => ({
        ...current,
        [studentId]: "",
      }))
      return
    }

    let number = Number(value)

    if (number < 0) number = 0
    if (number > 100) number = 100

    setScores((current) => ({
      ...current,
      [studentId]: String(number),
    }))
  }

  async function saveMarks() {
    if (!selectedClass) {
      setMessage("Please select a class.")
      return
    }

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

      const refreshed = await fetch("/api/marks")
      const refreshedMarks = await refreshed.json()

      if (Array.isArray(refreshedMarks)) {
        setMarks(refreshedMarks)
      }
    } catch (error) {
      console.error("Failed to save marks:", error)
      setMessage("Failed to save marks.")
    } finally {
      setSaving(false)
    }
  }

  const selectedSubjectName =
    subjects.find(
      (subject) =>
        String(subject.id) ===
        String(selectedSubject)
    )?.name || ""

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
                      setMessage("")
                    }}
                    className="w-full rounded-md border bg-background p-2"
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((schoolClass) => (
                      <option
                        key={schoolClass.id}
                        value={schoolClass.name}
                      >
                        {schoolClass.name}
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
                      setMessage("")
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
                      setMessage("")
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
                          {subject.name} ({subject.code})
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {selectedClass && (
                <div className="mt-4 rounded-md border p-3 text-sm">
                  <strong>{selectedClass}</strong>
                  {" — "}
                  {filteredSubjects.length} subjects
                  available
                  {selectedClassObject?.streams?.length
                    ? ` — Streams: ${selectedClassObject.streams.join(", ")}`
                    : ""}
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
                    {selectedSubjectName}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {filteredStudents.length === 0 ? (
                    <p className="text-muted-foreground">
                      No students found in{" "}
                      {selectedClass}.
                    </p>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-muted-foreground">
                        {filteredStudents.length} student
                        {filteredStudents.length === 1
                          ? ""
                          : "s"}
                      </div>

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
                                  key={
                                    student.id
                                  }
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
                                    {student.stream ||
                                      "-"}
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

                      <div className="mt-6 flex flex-wrap items-center gap-4">
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
}                   student.id
                                  }
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
                                    {student.stream ||
                                      "-"}
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

                      <div className="mt-6 flex flex-wrap items-center gap-4">
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
