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
  const { data, addStudent, updateStudent } = useSchool()
  const firstClass = data.classes[0]
  const [draft, setDraft] = useState<Draft>(empty(firstClass?.id ?? '', firstClass?.streams[0] ?? ''))

  useEffect(() => {
    if (student) {
      const { id, ...rest } = student
      setDraft(rest)
    } else {
      const c = data.classes[0]
      setDraft(empty(c?.id ?? '', c?.streams[0] ?? ''))
    }
  }, [student, open, data.classes])

  const selectedClass = data.classes.find((c) => c.id === draft.classId)

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function handleSave() {
    if (!draft.firstName || !draft.lastName) return
    const admissionNo = draft.admissionNo || `KCS-${Math.floor(2000 + Math.random() * 8000)}`
    if (student) updateStudent(student.id, { ...draft, admissionNo })
    else addStudent({ ...draft, admissionNo })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{student ? 'Edit Student' : 'Register New Student'}</DialogTitle>
          <DialogDescription>
            {student ? 'Update the student record below.' : 'Enter the student details to enrol them.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="First name">
            <Input value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>
          <Field label="Admission No.">
            <Input value={draft.admissionNo} onChange={(e) => set('admissionNo', e.target.value)} placeholder="Auto" />
          </Field>
          <Field label="Gender">
            <Select value={draft.gender} onValueChange={(v) => set('gender', v as Gender)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Class">
            <Select
              value={draft.classId}
              onValueChange={(v) => {
                const c = data.classes.find((x) => x.id === v)
                setDraft((d) => ({ ...d, classId: v, stream: c?.streams[0] ?? '' }))
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {data.classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Stream">
            <Select value={draft.stream} onValueChange={(v) => set('stream', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {selectedClass?.streams.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={draft.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          </Field>
          <Field label="Admission date">
            <Input type="date" value={draft.admissionDate} onChange={(e) => set('admissionDate', e.target.value)} />
          </Field>
          <Field label="Guardian name">
            <Input value={draft.guardianName} onChange={(e) => set('guardianName', e.target.value)} />
          </Field>
          <Field label="Guardian phone">
            <Input value={draft.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email">
              <Input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{student ? 'Save changes' : 'Register student'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
