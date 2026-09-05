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
const { data, addClass, auth } = useSchool()

const [open, setOpen] = useState(false)
const [name, setName] = useState('')
const [streams, setStreams] = useState('')
const [teacherId, setTeacherId] = useState<string>('none')

const stats = useMemo(() => {
return data.classes.map((c) => {
const count = data.students.filter(
(s) => s.classId === c.id
).length

  const teacher = data.teachers.find(
    (t) => t.id === c.classTeacherId
  )

  return {
    ...c,
    count,
    teacher,
  }
})

}, [data])

const classGroups = [
{
name: 'Preschool',
description: 'Early childhood education',
classes: ['Playgroup', 'Preprimary 1', 'Preprimary 2'],
},
{
name: 'Lower Primary',
description: 'Grades 1 to 3',
classes: ['Grade 1', 'Grade 2', 'Grade 3'],
},
{
name: 'Upper Primary',
description: 'Grades 4 to 6',
classes: ['Grade 4', 'Grade 5', 'Grade 6'],
},
{
name: 'Junior School',
description: 'Grades 7 to 9',
classes: ['Grade 7', 'Grade 8', 'Grade 9'],
},
]

function normalizeClassName(value: string) {
return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function handleSave() {
if (!name.trim()) return
addClass({
  name: name.trim(),
  streams: streams
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  classTeacherId:
    teacherId === 'none' ? null : teacherId,
})

setName('')
setStreams('')
setTeacherId('none')
setOpen(false)
}

return ( <div className="flex flex-col gap-8">
<PageHeader
title="Classes & Streams"
description="Manage class levels, their streams and assigned class teachers."
actions={
auth?.role === 'admin' ? ( <Dialog open={open} onOpenChange={setOpen}>
<DialogTrigger render={<Button />}> <Plus className="size-4" />
New Class </DialogTrigger>

```
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Class Level</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cls-name">
                  Class name
                </Label>

                <Input
                  id="cls-name"
                  placeholder="e.g. Grade 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cls-streams">
                  Streams (comma separated)
                </Label>

                <Input
                  id="cls-streams"
                  placeholder="e.g. A, B, C"
                  value={streams}
                  onChange={(e) =>
                    setStreams(e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cls-teacher">
                  Class teacher
                </Label>

                <Select
                  value={teacherId}
                  onValueChange={(value) =>
                    setTeacherId(value ?? 'none')
                  }
                >
                  <SelectTrigger id="cls-teacher">
                    <SelectValue placeholder="Assign a teacher" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="none">
                      Unassigned
                    </SelectItem>

                    {data.teachers.map((t) => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                      >
                        {teacherName(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleSave}>
                Save Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null
    }
  />

  {classGroups.map((group) => {
    return (
      <section
        key={group.name}
        className="flex flex-col gap-4"
      >
        <div className="border-b pb-3">
          <h2 className="text-2xl font-bold tracking-tight">
            {group.name}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {group.description}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {group.classes.map((groupClassName) => {
            const classData = stats.find(
              (c) =>
                normalizeClassName(c.name) ===
                normalizeClassName(groupClassName)
            )

            if (!classData) {
              return (
                <Card
                  key={groupClassName}
                  className="border-dashed"
                >
                  <CardContent className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                    {groupClassName} not found
                  </CardContent>
                </Card>
              )
            }

            return (
              <Card key={classData.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="size-5" />
                    </span>

                    {classData.name}
                  </CardTitle>

                  <Badge
                    variant="secondary"
                    className="gap-1"
                  >
                    <Users className="size-3" />
                    {classData.count}
                  </Badge>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 text-sm">
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Layers className="size-3.5" />
                      Streams
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {classData.streams.length > 0 ? (
                        classData.streams.map((stream) => (
                          <Badge
                            key={stream}
                            variant="outline"
                          >
                            {stream}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">
                          No streams
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Class Teacher
                    </p>

                    <p className="mt-0.5 font-medium">
                      {classData.teacher
                        ? teacherName(classData.teacher)
                        : 'Unassigned'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    )
  })}
</div>
)
}
