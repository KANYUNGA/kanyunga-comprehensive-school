'use client'

import { useMemo, useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Search, Trash2, UserPlus } from 'lucide-react'
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
import { formatKES, feeForStudent, studentName, type Student } from '@/lib/data'

export default function StudentsPage() {
  const { data, deleteStudent, auth } = useSchool()
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)

  const filtered = useMemo(() => {
    return data.students.filter((s) => {
      const matchesQuery =
        query === '' ||
        studentName(s).toLowerCase().includes(query.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(query.toLowerCase())
      const matchesClass = classFilter === 'all' || s.classId === classFilter
      return matchesQuery && matchesClass
    })
  }, [data.students, query, classFilter])

  function className(id: string) {
    return data.classes.find((c) => c.id === id)?.name ?? '—'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Register, search, and manage all enrolled students."
        actions={
          auth?.role === 'admin' && <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <UserPlus className="h-4 w-4" /> Register Student
          </Button>
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
          <Select value={classFilter} onValueChange={(value) => setClassFilter(value ?? "")}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {data.classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of {data.students.length} students
        </p>
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
                {auth?.role === 'admin' && <TableHead className="w-10" />}
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
                          {s.firstName[0]}{s.lastName[0]}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{studentName(s)}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell>
                      {className(s.classId)} <span className="text-muted-foreground">· {s.stream}</span>
                    </TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell>
                      <p className="text-sm">{s.guardianName}</p>
                      <p className="text-xs text-muted-foreground">{s.guardianPhone}</p>
                    </TableCell>
                    <TableCell>
                      {fee.balance === 0 ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Cleared</Badge>
                      ) : (
                        <span className="text-sm font-medium text-destructive">{formatKES(fee.balance)}</span>
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
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => deleteStudent(s.id)}>
                            <Trash2 className="h-4 w-4" /> Remove
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
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Plus className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No students found. Try adjusting your search or register a new student.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {auth?.role === 'admin' && (
        <StudentDialog open={dialogOpen} onOpenChange={setDialogOpen} student={editing} />
      )}
    </div>
  )
}
