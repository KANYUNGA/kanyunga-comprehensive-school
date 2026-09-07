'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSchool } from '@/lib/store'
import type { Gender, Student } from '@/lib/data'

type Draft = Omit<Student, 'id'>

const empty = (classId: string, stream: string): Draft => ({
  admissionNo: '',
  firstName: '',
  lastName: '',
  gender: 'Male',
  classId,
  stream,
  dateOfBirth: '',
  guardianName: '',
  guardianPhone: '',
  email: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  status: 'Active',
})

export function StudentDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  student: Student | null
}) {
  const { data } = useSchool()
  const [draft, setDraft] = useState<Draft>(() => {
    const c = data.classes[0]
    return empty(c?.id ?? '', c?.streams[0] ?? '')
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (student) {
      const { id, ...rest } = student
      setDraft(rest)
    } else {
      const c = data.classes[0]
      setDraft(empty(c?.id ?? '', c?.streams[0] ?? ''))
    }

    setError('')
  }, [student, open, data.classes])

  const selectedClass = data.classes.find(
    (c) => c.id === draft.classId
  )

  function set<K extends keyof Draft>(
    key: K,
    value: Draft[K]
  ) {
    setDraft((d) => ({
      ...d,
      [key]: value,
    }))
  }

  async function handleSave() {
    if (!draft.firstName || !draft.lastName) {
      setError('First name and last name are required.')
      return
    }

    if (!draft.classId) {
      setError('Please select a class.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const selectedClassName =
        data.classes.find(
          (c) => c.id === draft.classId
        )?.name ?? draft.classId

      const body = {
        admissionNo:
          draft.admissionNo ||
          `KCS-${Math.floor(2000 + Math.random() * 8000)}`,

        firstName: draft.firstName,
        lastName: draft.lastName,
        gender: draft.gender,

        // IMPORTANT:
        // Save the actual class NAME to Neon.
        className: selectedClassName,

        stream: draft.stream,

        dateOfBirth:
          draft.dateOfBirth || null,

        guardianName: draft.guardianName,
        guardianPhone: draft.guardianPhone,
        email: draft.email,

        admissionDate:
          draft.admissionDate || null,

        status: draft.status || 'Active',
      }

      const response = await fetch(
        student
          ? `/api/students?id=${encodeURIComponent(student.id)}`
          : '/api/students',
        {
          method: student ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to save student.'
        )
      }

      onOpenChange(false)

      // Refresh the page so Students, Marks and
      // other database-driven pages immediately
      // see the new learner.
      window.location.reload()
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save student.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {student
              ? 'Edit Student'
              : 'Register New Student'}
          </DialogTitle>

          <DialogDescription>
            {student
              ? 'Update the student record below.'
              : 'Enter the student details to enrol them.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="First name">
            <Input
              value={draft.firstName}
              onChange={(e) =>
                set(
                  'firstName',
                  e.target.value
                )
              }
            />
          </Field>

          <Field label="Last name">
            <Input
              value={draft.lastName}
              onChange={(e) =>
                set(
                  'lastName',
                  e.target.value
                )
              }
            />
          </Field>

          <Field label="Admission No.">
            <Input
              value={draft.admissionNo}
              onChange={(e) =>
                set(
                  'admissionNo',
                  e.target.value
                )
              }
              placeholder="Auto"
            />
          </Field>

          <Field label="Gender">
            <Select
              value={draft.gender}
              onValueChange={(v) =>
                set(
                  'gender',
                  v as Gender
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Male">
                  Male
                </SelectItem>

                <SelectItem value="Female">
                  Female
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Class">
            <Select
              value={draft.classId}
              onValueChange={(v) => {
                const c =
                  data.classes.find(
                    (x) => x.id === v
                  )

                setDraft((d) => ({
                  ...d,
                  classId: v ?? '',
                  stream:
                    c?.streams[0] ?? '',
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>

              <SelectContent>
                {data.classes.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Stream">
            <Select
              value={draft.stream}
              onValueChange={(v) =>
                set(
                  'stream',
                  v ?? ''
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stream" />
              </SelectTrigger>

              <SelectContent>
                {selectedClass?.streams.map(
                  (s) => (
                    <SelectItem
                      key={s}
                      value={s}
                    >
                      {s}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Date of birth">
            <Input
              type="date"
              value={draft.dateOfBirth}
              onChange={(e) =>
                set(
                  'dateOfBirth',
                  e.target.value
                )
              }
            />
          </Field>

          <Field label="Admission date">
            <Input
              type="date"
              value={draft.admissionDate}
              onChange={(e) =>
                set(
                  'admissionDate',
                  e.target.value
                )
              }
            />
          </Field>

          <Field label="Guardian name">
            <Input
              value={draft.guardianName}
              onChange={(e) =>
                set(
                  'guardianName',
                  e.target.value
                )
              }
            />
          </Field>

          <Field label="Guardian phone">
            <Input
              value={draft.guardianPhone}
              onChange={(e) =>
                set(
                  'guardianPhone',
                  e.target.value
                )
              }
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(e) =>
                  set(
                    'email',
                    e.target.value
                  )
                }
              />
            </Field>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : student
                ? 'Save changes'
                : 'Register student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
      </Label>

      {children}
    </div>
  )
        }
