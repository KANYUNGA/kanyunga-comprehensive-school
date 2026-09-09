```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  GraduationCap,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type Teacher = {
  id?: number | string
  name?: string
  fullName?: string
  email?: string
  phone?: string
  subject?: string
  subjects?: string[]
  className?: string
  classId?: string
  status?: string
}

const emptyTeacher: Teacher = {
  name: '',
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  className: '',
  classId: '',
  status: 'Active',
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [form, setForm] = useState<Teacher>(emptyTeacher)

  async function loadTeachers() {
    try {
      setLoading(true)

      const response = await fetch('/api/teachers', {
        cache: 'no-store',
      })

      const data = await response.json()

      if (data?.success && Array.isArray(data.data)) {
        setTeachers(data.data)
      } else if (Array.isArray(data)) {
        setTeachers(data)
      } else {
        setTeachers([])
      }
    } catch (error) {
      console.error('Failed to load teachers:', error)
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [])

  function teacherName(teacher: Teacher) {
    return (
      teacher.fullName?.trim() ||
      teacher.name?.trim() ||
      'Unnamed Teacher'
    )
  }

  function openAddDialog() {
    setEditingTeacher(null)
    setForm({ ...emptyTeacher })
    setOpen(true)
  }

  function openEditDialog(teacher: Teacher) {
    setEditingTeacher(teacher)
    setForm({
      ...emptyTeacher,
      ...teacher,
    })
    setOpen(true)
  }

  function updateField(field: keyof Teacher, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSave() {
    try {
      const payload = {
        ...form,
        fullName: teacherName(form),
        name: teacherName(form),
      }

      const response = await fetch('/api/teachers', {
        method: editingTeacher ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          editingTeacher
            ? {
                ...payload,
                id: editingTeacher.id,
              }
            : payload
        ),
      })

      const data = await response.json()

      if (!response.ok || data?.success === false) {
        alert(data?.error || 'Failed to save teacher')
        return
      }

      setOpen(false)
      setEditingTeacher(null)
      setForm({ ...emptyTeacher })
      await loadTeachers()
    } catch (error) {
      console.error('Save teacher error:', error)
      alert('Failed to save teacher')
    }
  }

  async function handleDelete(teacher: Teacher) {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${teacherName(teacher)}?`
    )

    if (!confirmed) return

    try {
      const response = await fetch('/api/teachers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: teacher.id,
        }),
      })

      const data = await response.json()

      if (!response.ok || data?.success === false) {
        alert(data?.error || 'Failed to remove teacher')
        return
      }

      await loadTeachers()
    } catch (error) {
      console.error('Delete teacher error:', error)
      alert('Failed to remove teacher')
    }
  }

  const filteredTeachers = useMemo(() => {
    const search = query.trim().toLowerCase()

    if (!search) return teachers

    return teachers.filter((teacher) => {
      const text = [
        teacherName(teacher),
        teacher.email,
        teacher.phone,
        teacher.subject,
        teacher.className,
        teacher.classId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(search)
    })
  }, [teachers, query])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Teachers
          </h1>
          <p className="text-muted-foreground">
            Manage teachers and their information.
          </p>
        </div>

        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>
              Teacher List ({filteredTeachers.length})
            </CardTitle>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search teachers..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading teachers...
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No teachers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b text-left text-sm">
                    <th className="px-3 py-3 font-medium">
                      Teacher
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Contact
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Subject
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Class
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Status
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTeachers.map((teacher, index) => (
                    <tr
                      key={teacher.id ?? index}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div>
                            <div className="font-medium">
                              {teacherName(teacher)}
                            </div>

                            {teacher.id !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                ID: {teacher.id}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="space-y-1 text-sm">
                          {teacher.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {teacher.email}
                            </div>
                          )}

                          {teacher.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {teacher.phone}
                            </div>
                          )}

                          {!teacher.email && !teacher.phone && (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        {teacher.subjects?.length
                          ? teacher.subjects.join(', ')
                          : teacher.subject || '—'}
                      </td>

                      <td className="px-3 py-4">
                        {teacher.className ||
                          teacher.classId ||
                          '—'}
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                          {teacher.status || 'Active'}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              openEditDialog(teacher)
                            }
                            title="Edit teacher"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() =>
                              handleDelete(teacher)
                            }
                            title="Remove teacher"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTeacher
                ? 'Edit Teacher'
                : 'Add Teacher'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="teacher-name">
                Full Name
              </Label>
              <Input
                id="teacher-name"
                value={form.fullName || form.name || ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                    name: event.target.value,
                  }))
                }
                placeholder="Enter teacher name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-email">
                Email
              </Label>
              <Input
                id="teacher-email"
                type="email"
                value={form.email || ''}
                onChange={(event) =>
                  updateField('email', event.target.value)
                }
                placeholder="teacher@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-phone">
                Phone
              </Label>
              <Input
                id="teacher-phone"
                value={form.phone || ''}
                onChange={(event) =>
                  updateField('phone', event.target.value)
                }
                placeholder="Phone number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-subject">
                Subject
              </Label>
              <Input
                id="teacher-subject"
                value={form.subject || ''}
                onChange={(event) =>
                  updateField('subject', event.target.value)
                }
                placeholder="e.g. Mathematics"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacher-class">
                Class
              </Label>
              <Input
                id="teacher-class"
                value={form.className || form.classId || ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    className: event.target.value,
                    classId: event.target.value,
                  }))
                }
                placeholder="e.g. Grade 8"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleSave}>
                <GraduationCap className="mr-2 h-4 w-4" />
                {editingTeacher
                  ? 'Save Changes'
                  : 'Add Teacher'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```
