"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Edit,
  Search,
  Trash2,
  UserPlus,
  Users,
  Upload,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StudentDialog } from "@/components/student-dialog"
import { useSchool } from "@/lib/store"
import {
  formatKES,
  feeForStudent,
  studentName,
  type Student,
} from "@/lib/data"

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
  admissionNo: string
  firstName: string
  middleName?: string
  lastName: string
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

type StudentWithPhoto = Student & {
  photoUrl?: string
}

function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

function normalizeClassName(value: unknown): string {
  const text = safeString(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")

  if (text === "playgroup" || text === "playgroup") {
    return "Playgroup"
  }

  if (text === "preprimary1" || text === "pp1") {
    return "PP1"
  }

  if (text === "preprimary2" || text === "pp2") {
    return "PP2"
  }

  return safeString(value).trim()
}

function mapApiStudent(student: ApiStudent): StudentWithPhoto {
  const className = normalizeClassName(
    student.className ?? student.classId
  )

  return {
    id: String(student.id),
    admissionNo: safeString(student.admissionNo),
    firstName: safeString(student.firstName),
    middleName: safeString(student.middleName),
    lastName: safeString(student.lastName),
    gender: safeString(student.gender),
    classId: className,
    stream: safeString(student.stream),
    dateOfBirth: safeString(student.dateOfBirth),
    guardianName: safeString(student.guardianName),
    guardianPhone: safeString(student.guardianPhone),
    address: safeString(student.address),
    email: safeString(student.email),
    admissionDate: safeString(student.admissionDate),
    status: safeString(student.status) || "Active",
    photoUrl: safeString(student.photoUrl),
  }
}

export default function StudentsPage() {
  const { deleteStudent, role } = useSchool()

  const [students, setStudents] = useState<StudentWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [query, setQuery] = useState("")
  const [classFilter, setClassFilter] = useState("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] =
    useState<StudentWithPhoto | null>(null)

  const isAdmin =
    safeString(role).trim().toLowerCase() === "admin"

  async function loadStudents() {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/students", {
        cache: "no-store",
      })

      const json = await response.json()

      if (!response.ok || json.success === false) {
        throw new Error(
          json.error || "Failed to load students"
        )
      }

      const apiStudents = Array.isArray(json)
        ? json
        : Array.isArray(json.students)
          ? json.students
          : []

      const mapped = apiStudents.map(
        (student: ApiStudent) =>
          mapApiStudent(student)
      )

      setStudents(mapped)
    } catch (err) {
      console.error("Students page error:", err)

      setStudents([])

      setError(
        err instanceof Error
          ? err.message
          : "Students could not be loaded from the database."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()

    return students.filter((student) => {
      const name = studentName(student).toLowerCase()

      const admissionNo = safeString(
        student.admissionNo
      ).toLowerCase()

      const studentClass = normalizeClassName(
        student.classId
      ).toLowerCase()

      const selectedClass =
        normalizeClassName(classFilter).toLowerCase()

      const matchesSearch =
        search === "" ||
        name.includes(search) ||
        admissionNo.includes(search)

      const matchesClass =
        classFilter === "all" ||
        studentClass === selectedClass

      return matchesSearch && matchesClass
    })
  }, [students, query, classFilter])

  async function handleDelete(student: Student) {
    if (!isAdmin) {
      return
    }

    const name = studentName(student)

    const confirmed = window.confirm(
      `Are you sure you want to remove ${name}?`
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteStudent(student.id)

      setStudents((current) =>
        current.filter(
          (item) => String(item.id) !== String(student.id)
        )
      )
    } catch (err) {
      console.error("Failed to delete student:", err)

      alert(
        err instanceof Error
          ? err.message
          : "Failed to remove student."
      )
    }
  }

  function handleEdit(student: StudentWithPhoto) {
    if (!isAdmin) {
      return
    }

    setEditingStudent(student)
    setDialogOpen(true)
  }

  function handleAdd() {
    if (!isAdmin) {
      return
    }

    setEditingStudent(null)
    setDialogOpen(true)
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open)

    if (!open) {
      setEditingStudent(null)
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
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              Register Student
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => {
                alert(
                  "Learner import will be added here."
                )
              }}
            >
              <Upload className="h-4 w-4" />
              Import Learners
            </button>
          </div>
        )}
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold">
            Unable to load students
          </div>

          <div className="mt-1">
            {error}
          </div>

          <button
            type="button"
            onClick={loadStudents}
            className="mt-3 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Total Students
              </p>

              <p className="text-2xl font-bold">
                {loading ? "..." : students.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Showing
          </p>

          <p className="text-2xl font-bold">
            {loading ? "..." : filtered.length}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Classes
          </p>

          <p className="text-2xl font-bold">
            {SCHOOL_CLASSES.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search by student name or admission number..."
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={classFilter}
          onChange={(event) =>
            setClassFilter(event.target.value)
          }
          className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Classes</option>

          {SCHOOL_CLASSES.map((className) => (
            <option
              key={className}
              value={className}
            >
              {className}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {loading ? 0 : filtered.length}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-foreground">
          {loading ? 0 : students.length}
        </span>{" "}
        students
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  Student
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Adm. No
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Class
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Gender
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Guardian
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Fee Balance
                </th>

                {isAdmin && (
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 opacity-40" />

                      <p className="font-medium">
                        No students found
                      </p>

                      <p className="text-xs">
                        Try changing your search or class filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((student) => {
                  const fee = feeForStudent(
                    student.id
                  )

                  const balance =
                    typeof fee?.balance === "number"
                      ? fee.balance
                      : 0

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={studentName(student)}
                              className="h-10 w-10 rounded-full border object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {safeString(
                                student.firstName
                              )
                                .charAt(0)
                                .toUpperCase()}
                              {safeString(
                                student.lastName
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="font-medium">
                              {studentName(student)}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {student.status ||
                                "Active"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {student.admissionNo || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {normalizeClassName(
                          student.classId
                        ) || "—"}
                        {student.stream && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({student.stream})
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {student.gender || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          {student.guardianName || "—"}
                        </div>

                        {student.guardianPhone && (
                          <div className="text-xs text-muted-foreground">
                            {student.guardianPhone}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            balance > 0
                              ? "font-medium text-destructive"
                              : "font-medium"
                          }
                        >
                          {formatKES(balance)}
                        </span>

                        {balance <= 0 && (
                          <div className="text-xs text-muted-foreground">
                            Cleared
                          </div>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(student)
                              }
                              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(student)
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <StudentDialog
          open={dialogOpen}
          onOpenChange={handleDialogChange}
          student={editingStudent}
        />
      )}
    </div>
  )
}
