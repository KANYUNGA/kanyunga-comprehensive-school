
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { StudentDialog } from '@/components/student-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useSchool } from '@/lib/store'
import {
  formatKES,
  feeForStudent,
  type Student,
} from '@/lib/data'

const SCHOOL_CLASSES = [
  'Playgroup',
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
]

type StudentWithPhoto = Student & {
  photoUrl?: string
}

function safe(value: unknown): string {
  return value == null ? '' : String(value)
}

function displayStudentName(student: StudentWithPhoto): string {
  return [
    safe(student.firstName),
    safe(student.middleName),
    safe(student.lastName),
  ]
    .filter(Boolean)
    .join(' ') || 'Unnamed Student'
}

function normalizeStudent(value: any): StudentWithPhoto {
  return {
    id: safe(value?.id),
    admissionNo: safe(
      value?.admissionNo ??
        value?.admission_number ??
        value?.admissionNumber
    ),
    firstName: safe(
      value?.firstName ?? value?.first_name
    ),
    middleName: safe(
      value?.middleName ?? value?.middle_name
    ),
    lastName: safe(
      value?.lastName ?? value?.last_name
    ),
    gender: safe(value?.gender),
    classId: safe(
      value?.classId ??
        value?.className ??
        value?.class_name
    ),
    stream: safe(value?.stream),
    dateOfBirth: safe(
      value?.dateOfBirth ??
        value?.date_of_birth
    ),
    guardianName: safe(
      value?.guardianName ??
        value?.guardian_name ??
        value?.parentName ??
        value?.parent_name
    ),
    guardianPhone: safe(
      value?.guardianPhone ??
        value?.guardian_phone ??
        value?.parentPhone ??
        value?.parent_phone
    ),
    address: safe(value?.address),
    email: safe(value?.email),
    admissionDate: safe(
      value?.admissionDate ??
        value?.admission_date
    ),
    status: safe(value?.status) || 'Active',
    photoUrl: safe(
      value?.photoUrl ??
        value?.photo_url ??
        value?.photo
    ),
  }
}

function extractStudents(json: any): any[] {
  if (Array.isArray(json)) {
    return json
  }

  if (Array.isArray(json?.students)) {
    return json.students
  }

  return []
}

export default function StudentsPage() {
  const { data, role } = useSchool()

  const [students, setStudents] = useState<StudentWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)

  const isAdmin =
    safe(role).trim().toLowerCase() === 'admin'

  async function loadStudents() {
    try {
      setLoading(true)
      setErrorMessage('')

      const response = await fetch('/api/students', {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(
          `Students API returned ${response.status}`
        )
      }

      const json = await response.json()

      const records = extractStudents(json)

      const normalized = records
        .map(normalizeStudent)
        .filter((student) => student.id !== '')

      setStudents(normalized)
    } catch (error) {
      console.error('Failed to load students:', error)

      setStudents([])
      setErrorMessage(
        'Students could not be loaded from the database.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const filtered = useMemo(() => {
    const search = safe(query).trim().toLowerCase()

    return students.filter((student) => {
      const name =
        displayStudentName(student).toLowerCase()

      const admissionNo = safe(
        student.admissionNo
      ).toLowerCase()

      const studentClass = safe(
        student.classId
      ).trim().toLowerCase()

      const matchesSearch =
        search === '' ||
        name.includes(search) ||
        admissionNo.includes(search)

      const matchesClass =
        classFilter === 'all' ||
        studentClass ===
          classFilter.toLowerCase()

      return matchesSearch && matchesClass
    })
  }, [students, query, classFilter])

  function downloadClassList() {
    if (filtered.length === 0) return

    const selectedClass =
      classFilter === 'all'
        ? 'All Classes'
        : classFilter

    const headers = [
      'No.',
      'Admission Number',
      'Student Name',
      'Gender',
      'Class',
      'Stream',
      'Guardian',
      'Guardian Phone',
      'Email',
    ]

    const rows = filtered.map((student, index) => [
      index + 1,
      safe(student.admissionNo),
      displayStudentName(student),
      safe(student.gender),
      safe(student.classId),
      safe(student.stream),
      safe(student.guardianName),
      safe(student.guardianPhone),
      safe(student.email),
    ])

    const csvEscape = (value: unknown) => {
      const text = safe(value)
      return `"${text.replace(/"/g, '""')}"`
    }

    const csv = [
      headers.map(csvEscape).join(','),
      ...rows.map((row) =>
        row.map(csvEscape).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download =
      selectedClass.replace(/\s+/g, '_') +
      '_Class_List.csv'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  function openRegisterDialog() {
    if (!isAdmin) return

    setEditing(null)
    setDialogOpen(true)
  }

  function openEditDialog(student: Student) {
    if (!isAdmin) return

    setEditing(student)
    setDialogOpen(true)
  }

  async function handleDelete(student: Student) {
    if (!isAdmin) return

    const name = displayStudentName(
      student as StudentWithPhoto
    )

    const confirmed = window.confirm(
      `Are you sure you want to remove ${name}?`
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/students/${encodeURIComponent(
          safe(student.id)
        )}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error(
          `Delete failed with status ${response.status}`
        )
      }

      setStudents((current) =>
        current.filter(
          (item) =>
            safe(item.id) !==
            safe(student.id)
        )
      )
    } catch (error) {
      console.error(
        'Failed to delete student:',
        error
      )

      window.alert(
        'The student could not be removed. Please try again.'
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Register, search, group, and manage all enrolled students."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={downloadClassList}
              disabled={
                loading ||
                filtered.length === 0
              }
            >
              <Download className="h-4 w-4" />
              Download Class List
            </Button>

            {isAdmin && (
              <Button
                onClick={openRegisterDialog}
              >
                <UserPlus className="h-4 w-4" />
                Register Student
              </Button>
            )}
          </div>
        }
      />

      {errorMessage && (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">
                Unable to load students
              </p>

              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={loadStudents}
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search by name or admission number..."
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              className="pl-9"
            />
          </div>

          <Select
            value={classFilter}
            onValueChange={(value) =>
              setClassFilter(value || 'all')
            }
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Classes
              </SelectItem>

              {SCHOOL_CLASSES.map((className) => (
                <SelectItem
                  key={className}
                  value={className}
                >
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {loading
                ? '...'
                : filtered.length}
            </span>{' '}
            of{' '}
            <span className="font-medium text-foreground">
              {loading
                ? '...'
                : students.length}
            </span>{' '}
            students
          </p>

          <p className="text-sm font-medium text-foreground">
            {classFilter === 'all'
              ? 'All Classes'
              : classFilter}
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Adm. No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Fee Balance</TableHead>

                {isAdmin && (
                  <TableHead className="w-10" />
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 7 : 6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Loading students...
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                filtered.map((student) => {
                  const fee = feeForStudent(
                    {
                      ...data,
                      students,
                    },
                    student.id
                  )

                  const photoUrl = safe(
                    student.photoUrl
                  ).trim()

                  const name =
                    displayStudentName(student)

                  return (
                    <TableRow
                      key={student.id}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={`${name} passport photo`}
                              className="h-12 w-12 shrink-0 rounded-full border object-cover"
                            />
                          ) : (
                            <span
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-xs font-semibold text-primary"
                              aria-label={`No passport photo for ${name}`}
                            >
                              {safe(
                                student.firstName
                              )
                                .charAt(0)
                                .toUpperCase()}
                              {safe(
                                student.lastName
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {name}
                            </p>

                            {safe(
                              student.email
                            ) && (
                              <p className="truncate text-xs text-muted-foreground">
                                {safe(
                                  student.email
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {safe(
                          student.admissionNo
                        ) || '—'}
                      </TableCell>

                      <TableCell>
                        {safe(
                          student.classId
                        ) || '—'}

                        {safe(
                          student.stream
                        ) && (
                          <span className="text-muted-foreground">
                            {' '}
                            ·{' '}
                            {safe(
                              student.stream
                            )}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {safe(
                          student.gender
                        ) || '—'}
                      </TableCell>

                      <TableCell>
                        <p className="text-sm">
                          {safe(
                            student.guardianName
                          ) || '—'}
                        </p>

                        {safe(
                          student.guardianPhone
                        ) && (
                          <p className="text-xs text-muted-foreground">
                            {safe(
                              student.guardianPhone
                            )}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        {fee.balance === 0 ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700"
                          >
                            Cleared
                          </Badge>
                        ) : (
                          <span className="text-sm font-medium text-destructive">
                            {formatKES(
                              fee.balance
                            )}
                          </span>
                        )}
                      </TableCell>

                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />

                                <span className="sr-only">
                                  Actions for{' '}
                                  {name}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  openEditDialog(
                                    student
                                  )
                                }
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  handleDelete(
                                    student
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}

              {!loading &&
                filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 7 : 6}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <Plus className="mx-auto mb-2 h-8 w-8 opacity-40" />

                      <p>
                        {students.length === 0
                          ? 'No students were returned from the database.'
                          : 'No students match your search or class filter.'}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {isAdmin && (
        <StudentDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)

            if (!open) {
              loadStudents()
            }
          }}
          student={editing}
        />
      )}
    </div>
  )
}
