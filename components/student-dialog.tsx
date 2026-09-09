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
import type { Gender, Student } from '@/lib/data'

type Draft = Omit<Student, 'id'> & {
  photoUrl?: string
}

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

const CLASS_STREAMS: Record<string, string[]> = {
  'Play Group': ['Main'],
  PP1: ['Main'],
  PP2: ['Main'],
  'Grade 1': ['Main'],
  'Grade 2': ['Main'],
  'Grade 3': ['Main'],
  'Grade 4': ['Main'],
  'Grade 5': ['Main'],
  'Grade 6': ['Main'],
  'Grade 7': ['Main'],
  'Grade 8': ['Main'],
  'Grade 9': ['Main'],
}

const empty = (className: string): Draft => ({
  admissionNo: '',
  firstName: '',
  lastName: '',
  gender: 'Male',
  classId: className,
  stream: CLASS_STREAMS[className]?.[0] ?? 'Main',
  dateOfBirth: '',
  guardianName: '',
  guardianPhone: '',
  email: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  status: 'Active',
  photoUrl: '',
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
  const [draft, setDraft] = useState<Draft>(() =>
    empty('Play Group')
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (student) {
      const { id, ...rest } = student

      setDraft({
        ...rest,
        classId: rest.classId || 'Play Group',
        stream: rest.stream || 'Main',
        photoUrl:
          (student as Student & { photoUrl?: string }).photoUrl || '',
      })
    } else {
      setDraft(empty('Play Group'))
    }

    setError('')
  }, [student, open])

  const selectedClass = draft.classId

  const availableStreams =
    CLASS_STREAMS[selectedClass] ?? ['Main']

  function set<K extends keyof Draft>(
    key: K,
    value: Draft[K]
  ) {
    setDraft((d) => ({
      ...d,
      [key]: value,
    }))
  }

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be smaller than 2 MB.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      set('photoUrl', String(reader.result))
      setError('')
    }

    reader.onerror = () => {
      setError('Unable to read the selected photo.')
    }

    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
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
      const body = {
        admissionNo:
          draft.admissionNo ||
          `KCS-${Math.floor(2000 + Math.random() * 8000)}`,

        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        gender: draft.gender,

        classId: draft.classId,
        className: draft.classId,

        stream: draft.stream || 'Main',

        dateOfBirth: draft.dateOfBirth || null,

        guardianName: draft.guardianName.trim(),
        guardianPhone: draft.guardianPhone.trim(),
        email: draft.email.trim(),

        admissionDate: draft.admissionDate || null,

        status: draft.status || 'Active',

        photoUrl: draft.photoUrl || null,
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
          result.error || 'Failed to save student.'
        )
      }

      onOpenChange(false)

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

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border bg-muted">
            {draft.photoUrl ? (
              <img
                src={draft.photoUrl}
                alt="Learner preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-muted-foreground">
                {draft.firstName?.[0] ?? 'L'}
                {draft.lastName?.[0] ?? ''}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Label
              htmlFor="learner-photo"
              className="cursor-pointer rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              📷 {draft.photoUrl ? 'Change Photo' : 'Upload Photo'}
            </Label>

            <Input
              id="learner-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <p className="text-xs text-muted-foreground">
              JPG, PNG or other image · Maximum 2 MB
            </p>
          </div>
        </div>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="First name">
            <Input
              value={draft.firstName}
              onChange={(e) =>
                set('firstName', e.target.value)
              }
            />
          </Field>

          <Field label="Last name">
            <Input
              value={draft.lastName}
              onChange={(e) =>
                set('lastName', e.target.value)
              }
            />
          </Field>

          <Field label="Admission No.">
            <Input
              value={draft.admissionNo}
              onChange={(e) =>
                set('admissionNo', e.target.value)
              }
              placeholder="Auto"
            />
          </Field>

          <Field label="Gender">
            <Select
              value={draft.gender}
              onValueChange={(v) =>
                set('gender', v as Gender)
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
                const streams =
                  CLASS_STREAMS[v] ?? ['Main']

                setDraft((d) => ({
                  ...d,
                  classId: v,
                  stream: streams[0],
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>

              <SelectContent>
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
          </Field>

          <Field label="Stream">
            <Select
              value={draft.stream}
              onValueChange={(v) =>
                set('stream', v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stream" />
              </SelectTrigger>

              <SelectContent>
                {availableStreams.map((stream) => (
                  <SelectItem
                    key={stream}
                    value={stream}
                  >
                    {stream}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Date of birth">
            <Input
              type="date"
              value={draft.dateOfBirth}
              onChange={(e) =>
                set('dateOfBirth', e.target.value)
              }
            />
          </Field>

          <Field label="Admission date">
            <Input
              type="date"
              value={draft.admissionDate}
              onChange={(e) =>
                set('admissionDate', e.target.value)
              }
            />
          </Field>

          <Field label="Guardian name">
            <Input
              value={draft.guardianName}
              onChange={(e) =>
                set('guardianName', e.target.value)
              }
            />
          </Field>

          <Field label="Guardian phone">
            <Input
              value={draft.guardianPhone}
              onChange={(e) =>
                set('guardianPhone', e.target.value)
              }
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(e) =>
                  set('email', e.target.value)
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
            onClick={() => onOpenChange(false)}
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
