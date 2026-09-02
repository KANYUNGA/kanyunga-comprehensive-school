'use client'

import { useMemo, useState } from 'react'
import { useSchool } from '@/lib/store'
import { teacherName } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GraduationCap, Layers, Plus, Users } from 'lucide-react'

export default function ClassesPage() {
  const { data, addClass } = useSchool()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [streams, setStreams] = useState('')
  const [teacherId, setTeacherId] = useState<string>('none')

  const stats = useMemo(() => {
    return data.classes.map((c) => {
      const count = data.students.filter((s) => s.classId === c.id).length
      const teacher = data.teachers.find((t) => t.id === c.classTeacherId)
      return { ...c, count, teacher }
    })
  }, [data])

  function handleSave() {
    if (!name.trim()) return
    addClass({
      name: name.trim(),
      streams: streams
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      classTeacherId: teacherId === 'none' ? null : teacherId,
    })
    setName('')
    setStreams('')
    setTeacherId('none')
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Classes & Streams"
        description="Manage class levels, their streams and assigned class teachers."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              New Class
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Class Level</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cls-name">Class name</Label>
                  <Input
                    id="cls-name"
                    placeholder="e.g. Form 1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cls-streams">Streams (comma separated)</Label>
                  <Input
                    id="cls-streams"
                    placeholder="e.g. North, South"
                    value={streams}
                    onChange={(e) => setStreams(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cls-teacher">Class teacher</Label>
                  <Select value={teacherId} onValueChange={(value) => setTeacherId(value ?? "")}>
                    <SelectTrigger id="cls-teacher">
                      <SelectValue placeholder="Assign a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {data.teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {teacherName(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Class</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="size-5" />
                </span>
                {c.name}
              </CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Users className="size-3" />
                {c.count}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Layers className="size-3.5" />
                  Streams
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.streams.length ? (
                    c.streams.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No streams</span>
                  )}
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Class Teacher</p>
                <p className="mt-0.5 font-medium">
                  {c.teacher ? teacherName(c.teacher) : 'Unassigned'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
