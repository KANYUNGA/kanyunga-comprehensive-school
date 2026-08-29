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
import type { Gender, Teacher } from '@/lib/data'
import { cn } from '@/lib/utils'

type Draft = Omit<Teacher, 'id'>

const empty = (): Draft => ({
  staffNo: '',
  firstName: '',
  lastName: '',
  gender: 'Male',
  phone: '',
  email: '',
  subjectIds: [],
  employmentDate: new Date().toISOString().slice(0, 10),
  status: 'Active',
})

export function TeacherDialog({
  open,
  onOpenChange,
  teacher,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  teacher: Teacher | null
}) {
  const { data, addTeacher, updateTeacher } = useSchool()
  const [draft, setDraft] = useState<Draft>(empty())

  useEffect(() => {
    if (teacher) {
      const { id, ...rest } = teacher
      setDraft(rest)
    } else {
      setDraft(empty())
    }
  }, [teacher, open])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function toggleSubject(id: string) {
    setDraft((d) => ({
      ...d,
      subjectIds: d.subjectIds.includes(id) ? d.subjectIds.filter((x) => x !== id) : [...d.subjectIds, id],
    }))
  }

  function handleSave() {
    if (!draft.firstName || !draft.lastName) return
    const staffNo = draft.staffNo || `TSC/${Math.floor(10000 + Math.random() * 90000)}`
    if (teacher) updateTeacher(teacher.id, { ...draft, staffNo })
    else addTeacher({ ...draft, staffNo })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{teacher ? 'Edit Teacher' : 'Register New Teacher'}</DialogTitle>
          <DialogDescription>
            {teacher ? 'Update the staff record below.' : 'Enter the teacher details and assign subjects.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="First name">
            <Input value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>
          <Field label="Staff / TSC No.">
            <Input value={draft.staffNo} onChange={(e) => set('staffNo', e.target.value)} placeholder="Auto" />
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
          <Field label="Phone">
            <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Employment date">
            <Input type="date" value={draft.employmentDate} onChange={(e) => set('employmentDate', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email">
              <Input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Subjects taught</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.subjects.map((s) => {
                const active = draft.subjectIds.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSubject(s.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{teacher ? 'Save changes' : 'Register teacher'}</Button>
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
