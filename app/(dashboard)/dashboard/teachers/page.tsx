'use client'

import { useMemo, useState } from 'react'
import { MoreHorizontal, Pencil, Search, Trash2, UserPlus } from 'lucide-react'
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
  const { data, deleteTeacher } = useSchool()
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)

  const filtered = useMemo(
    () =>
      data.teachers.filter(
        (t) =>
          query === '' ||
          teacherName(t).toLowerCase().includes(query.toLowerCase()) ||
          t.staffNo.toLowerCase().includes(query.toLowerCase()),
      ),
    [data.teachers, query],
  )

  function subjectNames(ids: string[]) {
    return ids.map((id) => data.subjects.find((s) => s.id === id)?.name).filter(Boolean) as string[]
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and their subject assignments."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <UserPlus className="h-4 w-4" /> Register Teacher
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or staff number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-xs font-semibold text-violet-600">
                        {t.firstName[0]}{t.lastName[0]}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{teacherName(t)}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{t.staffNo}</TableCell>
                  <TableCell className="text-sm">{t.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subjectNames(t.subjectIds).map((n) => (
                        <Badge key={n} variant="secondary" className="font-normal">{n}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">{t.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(t)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => deleteTeacher(t.id)}>
                          <Trash2 className="h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No teachers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <TeacherDialog open={dialogOpen} onOpenChange={setDialogOpen} teacher={editing} />
    </div>
  )
}
