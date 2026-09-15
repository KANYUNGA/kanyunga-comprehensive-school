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

type StudentWithPhoto = Student & {
  photoUrl?: string
}

type Draft = Omit<Student, 'id'> & {
  photoUrl?: string
}

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

const CLASS_STREAMS: Record<string, string[]> = {
  Playgroup: ['Main'],
  PP1: ['Main'],
  PP2: ['Main'],
  'Grade 1': ['A'],
  'Grade 2': ['Main'],
  'Grade 3': ['Main'],
  'Grade 4': ['Main'],
  'Grade 5': ['Main'],
  'Grade 6': ['Main'],
  'Grade 7': ['Main'],
  'Grade 8': ['Main'],
  'Grade 9': ['Main'],
}

function safeString(value: unknown): string {
  return String(value ?? '').trim()
}

function empty(className = 'Playgroup'): Draft {
  return {
    admissionNo: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    classId: className,
    stream: CLASS_STREAMS[className]?.[0] ?? 'Main',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    email: '',
    admissionDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
    photoUrl: '',
  }
}

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
    empty('Playgroup')
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (student) {
      const existing = student as StudentWithPhoto

      setDraft({
        admissionNo: safeString(existing.admissionNo),
        firstName: safeString(existing.firstName),
        middleName: safeString(existing.middleName),
        lastName: safeString(existing.lastName),
        gender: (safeString(existing.gender) || 'Male') as Gender,
        classId: safeString(existing.classId) || 'Playgroup',
        stream:
          safeString(existing.stream) ||
          CLASS_STREAMS[safeString(existing.classId)]?.[0] ||
          'Main',
        dateOfBirth: safeString(existing.dateOfBirth),
        guardianName: safeString(existing.guardianName),
        guardianPhone: safeString(existing.guardianPhone),
        address: safeString(existing.address),
        email: safeString(existing.email),
        admissionDate: safeString(existing.admissionDate),
        status: safeString(existing.status) || 'Active',
        photoUrl: safeString(existing.photoUrl),
      })
    } else {
      setDraft(empty('Playgroup'))
    }

    setError('')
  }, [student, open])

  const selectedClass = safeString(draft.classId) || 'Playgroup'

  const availableStreams =
    CLASS_STREAMS[selectedClass] ?? ['Main']

  function setField<K extends keyof Draft>(
    key: K,
    value: Draft[K]
  ) {
    setDraft((current) => ({
      ...current,
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
      const result = String(reader.result ?? '')

      if (!result) {
        setError('Unable to read the selected photo.')
        return
      }

      setField('photoUrl', result)
      setError('')
    }

    reader.onerror = () => {
      setError('Unable to read the selected photo.')
    }

    reader.readAsDataURL(file)
  }

  async function handleSave() {
    const firstName = safeString(draft.firstName)
    const middleName = safeString(draft.middleName)
    const lastName = safeString(draft.lastName)
    const admissionNo = safeString(draft.admissionNo)
    const className = safeString(draft.classId)
    const stream = safeString(draft.stream)
    const dateOfBirth = safeString(draft.dateOfBirth)
    const admissionDate = safeString(draft.admissionDate)
    const guardianName = safeString(draft.guardianName)
    const guardianPhone = safeString(draft.guardianPhone)
    const address = safeString(draft.address)
    const email = safeString(draft.email)
    const photoUrl = safeString(draft.photoUrl)

    if (!firstName) {
      setError('First name is required.')
      return
    }

    if (!lastName) {
      setError('Last name is required.')
      return
    }

    if (!className) {
      setError('Please select a class.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const generatedAdmissionNo =
        admissionNo ||
        `KCS-${Math.floor(2000 + Math.random() * 8000)}`

      const body = {
        admissionNo: generatedAdmissionNo,

        firstName,
        middleName,
        lastName,

        gender: draft.gender || 'Male',

        classId: className,
        className,

        stream: stream || CLASS_STREAMS[className]?.[0] || 'Main',

        dateOfBirth: dateOfBirth || null,

        guardianName,
        guardianPhone,
        address,
        email,

        admissionDate: admissionDate || null,

        status: safeString(draft.status) || 'Active',

        photoUrl: photoUrl || null,
      }

      const url = student
        ? `/api/students/${encodeURIComponent(String(student.id))}`
        : '/api/students'

      const response = await fetch(url, {
        method: student ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      let result: any = null

      try {
        result = await response.json()
      } catch {
        result = null
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Failed to ${student ? 'update' : 'register'} student.`
        )
      }

      onOpenChange(false)

      /*
       * Reload the page so the newly inserted/updated
       * Neon record and passport photo appear immediately.
       */
      window.location.reload()
    } catch (err) {
      console.error('Student save error:', err)

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
              ? 'Update the student details and passport photo.'
              : 'Enter the student details and passport photo.'}
          </DialogDescription>
        </DialogHeader>

        {/* PASSPORT PHOTO */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border bg-muted">
            {draft.photoUrl ? (
              <img
                src={draft.photoUrl}
                alt="Student passport photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-muted-foreground">
                {safeString(draft.firstName).charAt(0) || 'L'}
                {safeString(draft.lastName).charAt(0)}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Label
              htmlFor="learner-photo"
              className="cursor-pointer rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              📷{' '}
              {draft.photoUrl
                ? 'Change Photo'
                : 'Upload Passport Photo'}
            </Label>

            <Input
              id="learner-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <p className="text-xs text-muted-foreground">
              JPG, PNG or WEBP · Maximum 2 MB
            </p>
          </div>
        </div>

        {/* STUDENT DETAILS */}
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="First name">
            <Input
              value={safeString(draft.firstName)}
              onChange={(event) =>
                setField('firstName', event.target.value)
              }
              placeholder="First name"
            />
          </Field>

          <Field label="Middle name">
            <Input
              value={safeString(draft.middleName)}
              onChange={(event) =>
                setField('middleName', event.target.value)
              }
              placeholder="Middle name"
            />
          </Field>

          <Field label="Last name">
            <Input
              value={safeString(draft.lastName)}
              onChange={(event) =>
                setField('lastName', event.target.value)
              }
              placeholder="Last name"
            />
          </Field>

          <Field label="Admission No.">
            <Input
              value={safeString(draft.admissionNo)}
              onChange={(event) =>
                setField('admissionNo', event.target.value)
              }
              placeholder="Auto-generated if blank"
            />
          </Field>

          <Field label="Gender">
            <Select
              value={draft.gender || 'Male'}
              onValueChange={(value) =>
                setField('gender', value as Gender)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
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
              value={selectedClass}
              onValueChange={(value) => {
                const streams =
                  CLASS_STREAMS[value] ?? ['Main']

                setDraft((current) => ({
                  ...current,
                  classId: value,
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
              value={
                safeString(draft.stream) ||
                availableStreams[0]
              }
              onValueChange={(value) =>
                setField('stream', value)
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
              value={safeString(draft.dateOfBirth)}
              onChange={(event) =>
                setField(
                  'dateOfBirth',
                  event.target.value
                )
              }
            />
          </Field>

          <Field label="Admission date">
            <Input
              type="date"
              value={safeString(draft.admissionDate)}
              onChange={(event) =>
                setField(
                  'admissionDate',
                  event.target.value
                )
              }
            />
          </Field>

          <Field label="Guardian name">
            <Input
              value={safeString(draft.guardianName)}
              onChange={(event) =>
                setField(
                  'guardianName',
                  event.target.value
                )
              }
              placeholder="Parent / guardian name"
            />
          </Field>

          <Field label="Guardian phone">
            <Input
              value={safeString(draft.guardianPhone)}
              onChange={(event) =>
                setField(
                  'guardianPhone',
                  event.target.value
                )
              }
              placeholder="Phone number"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Address">
              <Input
                value={safeString(draft.address)}
                onChange={(event) =>
                  setField(
                    'address',
                    event.target.value
                  )
                }
                placeholder="Home address"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Email">
              <Input
                type="email"
                value={safeString(draft.email)}
                onChange={(event) =>
                  setField(
                    'email',
                    event.target.value
                  )
                }
                placeholder="Email address"
              />
            </Field>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {error}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="button"
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
