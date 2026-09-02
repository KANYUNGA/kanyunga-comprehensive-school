'use client'

import { useMemo, useState } from 'react'
import { useSchool } from '@/lib/store'
import type { Subject } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { BookOpen, Plus } from 'lucide-react'

const CATEGORIES: Subject['category'][] = [
  'Languages',
  'Mathematics',
  'Sciences',
  'Humanities',
  'Technicals',
]

export default function SubjectsPage() {
  const { data, addSubject } = useSchool()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<Subject['category']>('Sciences')

  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: cat,
      subjects: data.subjects.filter((s) => s.category === cat),
    })).filter((g) => g.subjects.length > 0)
  }, [data.subjects])

  function handleSave() {
    if (!name.trim() || !code.trim()) return
    addSubject({ name: name.trim(), code: code.trim(), category })
    setName('')
    setCode('')
    setCategory('Sciences')
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects"
        description="The subjects offered following the Kenyan curriculum."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              New Subject
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subject</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-name">Subject name</Label>
                  <Input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-code">Subject code</Label>
                  <Input id="sub-code" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-cat">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Subject['category'])}>
                    <SelectTrigger id="sub-cat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
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
                <Button onClick={handleSave}>Save Subject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {grouped.map((g) => (
          <Card key={g.category}>
            <CardContent className="pt-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-4" />
                </span>
                <h3 className="font-heading font-semibold">{g.category}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {g.subjects.length}
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.subjects.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {s.code}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
