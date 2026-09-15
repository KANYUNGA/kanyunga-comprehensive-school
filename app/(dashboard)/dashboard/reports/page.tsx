"use client"

import { useEffect, useMemo, useState } from "react"
import { Printer, FileText } from "lucide-react"

import { useSchool } from "@/lib/store"
import { ReportCard } from "@/components/report-card"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

function normalizeClass(value: unknown): string {
  const text = safeString(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")

  if (text === "playgroup") return "Playgroup"
  if (text === "pp1") return "PP1"
  if (text === "pp2") return "PP2"

  return safeString(value).trim()
}

export default function ReportsPage() {
  const { data } = useSchool()

  /*
   * Always protect arrays coming from the database.
   */
  const students = Array.isArray(data?.students)
    ? data.students
    : []

  const classes = Array.isArray(data?.classes)
    ? data.classes
    : []

  const exams = Array.isArray(data?.exams)
    ? data.exams
    : []

  /*
   * Start with the first available class.
   */
  const [classId, setClassId] = useState("")

  const [studentId, setStudentId] = useState("")

  const [examId, setExamId] = useState("")

  /*
   * Set initial selections after database data loads.
   */
  useEffect(() => {
    if (!classId && classes.length > 0) {
      setClassId(String(classes[0].id))
    }
  }, [classes, classId])

  useEffect(() => {
    if (!examId && exams.length > 0) {
      setExamId(String(exams[0].id))
    }
  }, [exams, examId])

  /*
   * Students belonging to the selected class.
   *
   * We support both:
   * - classId containing the database class ID
   * - classId containing the actual class name
   */
  const roster = useMemo(() => {
    if (!classId) {
      return []
    }

    const selectedClass = classes.find(
      (item) =>
        String(item.id) === String(classId)
    )

    const selectedClassName =
      normalizeClass(selectedClass?.name)

    return students.filter((student) => {
      if (
        safeString(student.status)
          .trim()
          .toLowerCase() === "inactive"
      ) {
        return false
      }

      const studentClassId =
        safeString(student.classId)

      const studentClassName =
        normalizeClass(
          student.classId
        )

      const matchesId =
        studentClassId === String(classId)

      const matchesName =
        selectedClassName !== "" &&
        studentClassName ===
          selectedClassName

      return matchesId || matchesName
    })
  }, [
    students,
    classes,
    classId,
  ])

  /*
   * Automatically select the first student
   * whenever the selected class changes.
   */
  useEffect(() => {
    if (roster.length === 0) {
      setStudentId("")
      return
    }

    const stillExists = roster.some(
      (student) =>
        String(student.id) ===
        String(studentId)
    )

    if (!stillExists) {
      setStudentId(
        String(roster[0].id)
      )
    }
  }, [roster, studentId])

  const activeStudentId =
    roster.some(
      (student) =>
        String(student.id) ===
        String(studentId)
    )
      ? String(studentId)
      : roster.length > 0
        ? String(roster[0].id)
        : ""

  const selectedClass = classes.find(
    (item) =>
      String(item.id) ===
      String(classId)
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Report Forms"
        description="Generate and print individual student academic report forms."
        actions={
          <Button
            type="button"
            onClick={() =>
              window.print()
            }
            className="print:hidden"
            disabled={!activeStudentId}
          >
            <Printer className="size-4" />
            Print Report
          </Button>
        }
      />

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold">
                Report Form Selection
              </h2>

              <p className="text-sm text-muted-foreground">
                Select a class, student and examination
                period to generate the report.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* CLASS */}
            <div className="flex flex-col gap-2">
              <Label>Class</Label>

              <Select
                value={classId}
                onValueChange={(value) => {
                  setClassId(value)
                  setStudentId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>

                <SelectContent>
                  {classes.length === 0 ? (
                    <SelectItem
                      value="no-class"
                      disabled
                    >
                      No classes available
                    </SelectItem>
                  ) : (
                    classes.map((item) => (
                      <SelectItem
                        key={String(item.id)}
                        value={String(item.id)}
                      >
                        {safeString(
                          item.name
                        ) || "Unnamed Class"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* STUDENT */}
            <div className="flex flex-col gap-2">
              <Label>Student</Label>

              <Select
                value={activeStudentId}
                onValueChange={(value) =>
                  setStudentId(value)
                }
                disabled={
                  roster.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      roster.length > 0
                        ? "Select student"
                        : "No students"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {roster.map((student) => {
                    const name = [
                      safeString(
                        student.firstName
                      ),
                      safeString(
                        student.middleName
                      ),
                      safeString(
                        student.lastName
                      ),
                    ]
                      .filter(Boolean)
                      .join(" ")

                    return (
                      <SelectItem
                        key={String(
                          student.id
                        )}
                        value={String(
                          student.id
                        )}
                      >
                        {name ||
                          "Unnamed Student"}{" "}
                        ·{" "}
                        {safeString(
                          student.admissionNo
                        )}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* EXAM */}
            <div className="flex flex-col gap-2">
              <Label>
                Examination / Term
              </Label>

              <Select
                value={examId}
                onValueChange={(value) =>
                  setExamId(value)
                }
                disabled={
                  exams.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      exams.length > 0
                        ? "Select examination"
                        : "No examinations"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem
                      key={String(exam.id)}
                      value={String(exam.id)}
                    >
                      {safeString(
                        exam.name
                      ) ||
                        safeString(
                          exam.title
                        ) ||
                        "Examination"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CURRENT SELECTION */}
          <div className="mt-6 grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Class
              </div>

              <div className="font-medium">
                {safeString(
                  selectedClass?.name
                ) || "—"}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Students in class
              </div>

              <div className="font-medium">
                {roster.length}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Selected examination
              </div>

              <div className="font-medium">
                {safeString(
                  exams.find(
                    (exam) =>
                      String(exam.id) ===
                      String(examId)
                  )?.name
                ) || "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REPORT */}
      {activeStudentId ? (
        <div
          id="student-report"
          className="report-print-area"
        >
          <ReportCard
            studentId={activeStudentId}
            examId={examId}
          />
        </div>
      ) : (
        <Card className="print:hidden">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />

            <h2 className="text-lg font-semibold">
              No student selected
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select a class containing students
              to generate a report form.
            </p>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .report-print-area {
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}
