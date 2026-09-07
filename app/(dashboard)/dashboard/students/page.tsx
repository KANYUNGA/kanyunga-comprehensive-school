'use client'

import { useMemo, useState } from 'react'
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
  studentName,
  type Student,
} from '@/lib/data'

const SCHOOL_CLASSES = [
  'Play Group',
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

export default function StudentsPage() {
  const { data, deleteStudent, auth } = useSchool()

  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)

  const filtered = useMemo(() => {
    return data.students.filter((s) => {
      const search = query.toLowerCase().trim()

      const matchesQuery =
        search === '' ||
        studentName(s).toLowerCase().includes(search) ||
        s.admissionNo.toLowerCase().includes(search)

      const studentClass = String(s.classId ?? '').trim()

      const matchesClass =
        classFilter === 'all' ||
        studentClass.toLowerCase() === classFilter.toLowerCase()

      return matchesQuery && matchesClass
    })
  }, [data.students, query, classFilter])

  function downloadClassList() {
    if (filtered.length === 0) {
      return
    }

    const selectedClass =
      classFilter === 'all' ? 'All Classes' : classFilter

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
      student.admissionNo,
      studentName(student),
      student.gender ?? '',
      student.classId ?? '',
      student.stream ?? '',
      student.guardianName ?? '',
      student.guardianPhone ?? '',
      student.email ?? '',
    ])

    const csvEscape = (value: unknown) => {
      const text = String(value ?? '')
      return `"${text.replace(/"/g, '""')}"`
    }

    const csv = [
      headers.map(csvEscape).join(','),
      ...rows.map((row) => row.map(csvEscape).join(',')),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${selectedClass.replace(/\s+/g, '_')}_Class_List.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
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
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" />
              Download Class List
            </Button>

            {auth?.role === 'admin' && (
              <Button
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                <UserPlus className="h-4 w-4" />
                Register Student
              </Button>
            )}
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search by name or admission number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={classFilter}
            onValueChange={(value) => setClassFilter(value ?? 'all')}
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>

              {SCHOOL_CLASSES.map((className) => (
                <SelectItem key={className} value={className}>
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
              {filtered.length}
            </span>{' '}
            of {data.students.length} students
          </p>

          <p className="text-sm font-medium text-foreground">
            {classFilter === 'all' ? 'All Classes' : classFilter}
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

                {auth?.role === 'admin' && (
                  <TableHead className="w-10" />
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((s) => {
                const fee = feeForStudent(data, s.id)

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {s.firstName?.[0] ?? ''}
                          {s.lastName?.[0] ?? ''}
                        </span>

                        <div>
                          <p className="font-medium text-foreground">
                            {studentName(s)}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {s.admissionNo}
                    </TableCell>

                    <TableCell>
                      {s.classId || '—'}

                      {s.stream && (
                        <span className="text-muted-foreground">
                          {' '}
                          · {s.stream}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>{s.gender}</TableCell>

                    <TableCell>
                      <p className="text-sm">{s.guardianName}</p>

                      <p className="text-xs text-muted-foreground">
                        {s.guardianPhone}
                      </p>
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
                          {formatKES(fee.balance)}
                        </span>
                      )}
                    </TableCell>

                    {auth?.role === 'admin' && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(s)
                                setDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => deleteStudent(s.id)}
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

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={auth?.role === 'admin' ? 7 : 6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <Plus className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No students found. Try adjusting your search or register
                    a new student.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {auth?.role === 'admin' && (
        <StudentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          student={editing}
        />
      )}
    </div>
  )
}
