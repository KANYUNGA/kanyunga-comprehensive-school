'use client'

import { useMemo, useState } from 'react'
import {
MoreHorizontal,
Pencil,
Search,
Trash2,
UserPlus,
} from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { TeacherDialog } from '@/components/teacher-dialog'
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

import { useSchool } from '@/lib/store'
import { teacherName, type Teacher } from '@/lib/data'

export default function TeachersPage() {
const { data, deleteTeacher, auth } = useSchool()

const [query, setQuery] = useState('')
const [dialogOpen, setDialogOpen] = useState(false)
const [editing, setEditing] = useState<Teacher | null>(null)

const filtered = useMemo(() => {
const search = query.trim().toLowerCase()

if (!search) {
  return data.teachers
}

return data.teachers.filter((teacher) => {
  return (
    teacherName(teacher).toLowerCase().includes(search) ||
    String(teacher.staffNo ?? '')
      .toLowerCase()
      .includes(search) ||
    String(teacher.email ?? '')
      .toLowerCase()
      .includes(search) ||
    String(teacher.phone ?? '')
      .toLowerCase()
      .includes(search)
  )
})


}, [data.teachers, query])

function subjectNames(ids: string[] = []) {
return ids
.map(
(id) =>
data.subjects.find(
(subject) => String(subject.id) === String(id)
)?.name
)
.filter(Boolean) as string[]
}

function openRegisterDialog() {
setEditing(null)
setDialogOpen(true)
}

function openEditDialog(teacher: Teacher) {
setEditing(teacher)
setDialogOpen(true)
}

function handleDelete(teacher: Teacher) {
const confirmed = window.confirm(
Are you sure you want to remove ${teacherName(teacher)}?
)

if (!confirmed) {
  return
}

deleteTeacher(teacher.id)


}

return (
<div className="space-y-6">
<PageHeader
title="Teachers"
description="Manage teaching staff and their subject assignments."
actions={
auth?.role === 'admin' ? (
<Button onClick={openRegisterDialog}>
<UserPlus className="h-4 w-4" />
Register Teacher
</Button>
) : null
}
/>

  <Card className="p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          placeholder="Search by name, staff number, email or phone..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
        />
      </div>

      <Badge variant="secondary" className="w-fit">
        {filtered.length} of {data.teachers.length}
      </Badge>
    </div>
  </Card>

  <Card className="overflow-hidden p-0">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead>Staff No</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Subjects</TableHead>
            <TableHead>Status</TableHead>

            {auth?.role === 'admin' && (
              <TableHead className="w-10" />
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.map((teacher) => {
            const subjects = subjectNames(
              teacher.subjectIds ?? []
            )

            return (
              <TableRow key={teacher.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-semibold text-violet-600">
                      {teacher.firstName?.[0] ?? ''}
                      {teacher.lastName?.[0] ?? ''}
                    </span>

                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {teacherName(teacher)}
                      </p>

                      {teacher.email && (
                        <p className="truncate text-xs text-muted-foreground">
                          {teacher.email}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs">
                  {teacher.staffNo || '—'}
                </TableCell>

                <TableCell className="text-sm">
                  {teacher.phone || '—'}
                </TableCell>

                <TableCell>
                  {subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {subjects.map((name) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="font-normal"
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No subjects assigned
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      teacher.status === 'Inactive'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }
                  >
                    {teacher.status || 'Active'}
                  </Badge>
                </TableCell>

                {auth?.role === 'admin' && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />

                        <span className="sr-only">
                          Actions for {teacherName(teacher)}
                        </span>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            openEditDialog(teacher)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            handleDelete(teacher)
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

          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={auth?.role === 'admin' ? 6 : 5}
                className="py-12 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <UserPlus className="h-8 w-8 opacity-40" />

                  <p className="font-medium">
                    No teachers found.
                  </p>

                  <p className="text-sm">
                    {query
                      ? 'Try adjusting your search.'
                      : 'Register a teacher to see them here.'}
                  </p>

                  {auth?.role === 'admin' && !query && (
                    <Button
                      className="mt-2"
                      onClick={openRegisterDialog}
                    >
                      <UserPlus className="h-4 w-4" />
                      Register Teacher
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </Card>

  {auth?.role === 'admin' && (
    <TeacherDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      teacher={editing}
    />
  )}
</div>


)
}
