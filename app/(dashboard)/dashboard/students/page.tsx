"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Edit,
  Search,
  Trash2,
  UserPlus,
  Upload,
  Users,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StudentDialog } from "@/components/student-dialog"
import { useSchool } from "@/lib/store"
import type { Student } from "@/lib/data"

const SCHOOL_CLASSES = [
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

type ApiStudent = {
  id: string
  admissionNo?: string
  firstName?: string
  middleName?: string
  lastName?: string
  gender?: string
  classId?: string
  className?: string
  stream?: string
  dateOfBirth?: string
  guardianName?: string
  guardianPhone?: string
  address?: string
  email?: string
  admissionDate?: string
  status?: string
  photoUrl?: string
}

type DisplayStudent = Student & {
  photoUrl?: string
}

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

function className(value: unknown): string {
  const valueText = text(value).trim()

  const normalized = valueText
    .toLowerCase()
    .replace(/\s+/g, "")

  if (normalized === "playgroup") {
    return "Playgroup"
  }

  if (normalized === "pp1") {
    return "PP1"
  }

  if (normalized === "pp2") {
    return "PP2"
  }

  return valueText
}

function fullName(student: DisplayStudent): string {
  return [
    text(student.firstName).trim(),
    text(student.middleName).trim(),
    text(student.lastName).trim(),
  ]
    .filter(Boolean)
    .join(" ")
}

function mapStudent(student: ApiStudent): DisplayStudent {
  const selectedClass = className(
    student.className ?? student.classId
  )

  return {
    id: String(student.id),

    admissionNo: text(student.admissionNo),

    firstName: text(student.firstName),

    middleName: text(student.middleName),

    lastName: text(student.lastName),

    gender: text(student.gender),

    classId: selectedClass,

    stream: text(student.stream),

    dateOfBirth: text(student.dateOfBirth),

    guardianName: text(student.guardianName),

    guardianPhone: text(student.guardianPhone),

    address: text(student.address),

    email: text(student.email),

    admissionDate: text(student.admissionDate),

    status: text(student.status) || "Active",

    photoUrl: text(student.photoUrl),
  }
}

export default function StudentsPage() {
  const { deleteStudent, role } = useSchool()

  const [students, setStudents] = useState<
    DisplayStudent[]
  >([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const [search, setSearch] = useState("")

  const [selectedClass, setSelectedClass] =
    useState("all")

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editingStudent, setEditingStudent] =
    useState<DisplayStudent | null>(null)

  const isAdmin =
    text(role).trim().toLowerCase() === "admin"

  async function loadStudents() {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        "/api/students",
        {
          cache: "no-store",
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to load students"
        )
      }

      if (result?.success === false) {
        throw new Error(
          result?.error ||
            "Failed to load students"
        )
      }

      const rawStudents = Array.isArray(
        result?.students
      )
        ? result.students
        : Array.isArray(result)
          ? result
          : []

      const convertedStudents =
        rawStudents.map(
          (student: ApiStudent) =>
            mapStudent(student)
        )

      console.log(
        "STUDENTS PAGE:",
        convertedStudents.length
      )

      setStudents(convertedStudents)
    } catch (error) {
      console.error(
        "STUDENTS PAGE LOAD ERROR:",
        error
      )

      setStudents([])

      setError(
        error instanceof Error
          ? error.message
          : "Students could not be loaded from the database."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const filteredStudents = useMemo(() => {
    const searchText =
      search.trim().toLowerCase()

    const selected =
      className(selectedClass).toLowerCase()

    return students.filter((student) => {
      const name =
        fullName(student).toLowerCase()

      const admission =
        text(student.admissionNo).toLowerCase()

      const studentClass =
        className(student.classId).toLowerCase()

      const matchesSearch =
        searchText === "" ||
        name.includes(searchText) ||
        admission.includes(searchText)

      const matchesClass =
        selectedClass === "all" ||
        studentClass === selected

      return (
        matchesSearch &&
        matchesClass
      )
    })
  }, [
    students,
    search,
    selectedClass,
  ])

  function openAddDialog() {
    if (!isAdmin) {
      return
    }

    setEditingStudent(null)
    setDialogOpen(true)
  }

  function openEditDialog(
    student: DisplayStudent
  ) {
    if (!isAdmin) {
      return
    }

    setEditingStudent(student)
    setDialogOpen(true)
  }

  async function removeStudent(
    student: DisplayStudent
  ) {
    if (!isAdmin) {
      return
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to remove ${fullName(student)}?`
      )

    if (!confirmed) {
      return
    }

    try {
      await deleteStudent(student.id)

      setStudents((current) =>
        current.filter(
          (item) =>
            String(item.id) !==
            String(student.id)
        )
      )
    } catch (error) {
      console.error(
        "DELETE STUDENT ERROR:",
        error
      )

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to remove student."
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Register, search, group, and manage all enrolled students."
      >
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openAddDialog}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              Register Student
            </button>

            <button
              type="button"
              onClick={() =>
                window.alert(
                  "Learner import will be enabled here."
                )
              }
              className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              Import Learners
            </button>
          </div>
        )}
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">
            Unable to load students
          </div>

          <div className="mt-1 text-sm">
            {error}
          </div>

          <button
            type="button"
            onClick={loadStudents}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm text-muted-foreground">
                Total Students
              </div>

              <div className="text-2xl font-bold">
                {loading
                  ? "..."
                  : students.length}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            Showing
          </div>

          <div className="text-2xl font-bold">
            {loading
              ? "..."
              : filteredStudents.length}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            School Classes
          </div>

          <div className="text-2xl font-bold">
            {SCHOOL_CLASSES.length}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by student name or admission number..."
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={selectedClass}
          onChange={(event) =>
            setSelectedClass(
              event.target.value
            )
          }
          className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">
            All Classes
          </option>

          {SCHOOL_CLASSES.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing{" "}
        <strong className="text-foreground">
          {loading
            ? 0
            : filteredStudents.length}
        </strong>{" "}
        of{" "}
        <strong className="text-foreground">
          {loading
            ? 0
            : students.length}
        </strong>{" "}
        students
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Student
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Adm. No
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Class
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Gender
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Guardian
                </th>

                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Fee Balance
                </th>

                {isAdmin && (
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      isAdmin ? 7 : 6
                    }
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={
                      isAdmin ? 7 : 6
                    }
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(
                  (student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img
                              src={
                                student.photoUrl
                              }
                              alt={fullName(
                                student
                              )}
                              className="h-10 w-10 rounded-full border object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold">
                              {text(
                                student.firstName
                              )
                                .charAt(0)
                                .toUpperCase()}
                              {text(
                                student.lastName
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="font-medium">
                              {fullName(
                                student
                              ) || "Unnamed Student"}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {text(
                                student.status
                              ) ||
                                "Active"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {text(
                          student.admissionNo
                        ) || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {className(
                          student.classId
                        ) || "—"}

                        {student.stream && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (
                            {student.stream}
                            )
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {text(
                          student.gender
                        ) || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {text(
                          student.guardianName
                        ) || "—"}

                        {student.guardianPhone && (
                          <div className="text-xs text-muted-foreground">
                            {
                              student.guardianPhone
                            }
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium">
                          —
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditDialog(
                                  student
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeStudent(
                                  student
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <StudentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          student={editingStudent}
        />
      )}
    </div>
  )
}
