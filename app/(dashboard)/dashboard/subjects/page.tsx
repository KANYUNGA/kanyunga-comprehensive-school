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
import { BookOpen, Plus, Search } from 'lucide-react'

const CATEGORIES: Subject['category'][] = [
  'Languages',
  'Mathematics',
  'Sciences',
  'Humanities',
  'Technicals',
]

export default function SubjectsPage() {
  const { data, addSubject, auth } = useSchool()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<Subject['category']>('Sciences')
  const [search, setSearch] = useState('')

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return data.subjects

    return data.subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(term) ||
        subject.code.toLowerCase().includes(term) ||
        subject.category.toLowerCase().includes(term)
    )
  }, [data.subjects, search])

  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: cat,
      subjects: filteredSubjects.filter((s) => s.category === cat),
    })).filter((g) => g.subjects.length > 0)
  }, [filteredSubjects])

  const uncategorized = useMemo(() => {
    return filteredSubjects.filter(
      (s) => !CATEGORIES.includes(s.category)
    )
  }, [filteredSubjects])

  function handleSave() {
    if (!name.trim() || !code.trim()) return

    addSubject({
      name: name.trim(),
      code: code.trim(),
      category,
    })

    setName('')
    setCode('')
    setCategory('Sciences')
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects"
        description={`Showing ${filteredSubjects.length} of ${data.subjects.length} subjects offered by the school.`}
        actions={
          auth?.role === 'admin' ? (
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
                    <Input
                      id="sub-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mathematics"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sub-code">Subject code</Label>
                    <Input
                      id="sub-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. 101"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sub-cat">Category</Label>

                    <Select
                      value={category}
                      onValueChange={(v) =>
                        setCategory(v as Subject['category'])
                      }
                    >
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
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button onClick={handleSave}>
                    Save Subject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Search className="size-4 text-muted-foreground" />

          <Input
            placeholder="Search subjects by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Badge variant="secondary" className="whitespace-nowrap">
            {data.subjects.length} Subjects
          </Badge>
        </div>
      </Card>

      {grouped.map((g) => (
        <Card key={g.category}>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </span>

              <h3 className="font-heading font-semibold">
                {g.category}
              </h3>

              <Badge variant="secondary" className="ml-auto">
                {g.subjects.length}
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">
                    Category
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {g.subjects.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.name}
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground">
                      {s.code}
                    </TableCell>

                    <TableCell className="text-right">
                      {s.category}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {uncategorized.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </span>

              <h3 className="font-heading font-semibold">
                Other Subjects
              </h3>

              <Badge variant="secondary" className="ml-auto">
                {uncategorized.length}
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">
                    Category
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {uncategorized.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.name}
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground">
                      {s.code}
                    </TableCell>

                    <TableCell className="text-right">
                      {s.category || 'Other'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.subjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No subjects were loaded from the database.
          </CardContent>
        </Card>
      )}

      {data.subjects.length > 0 && filteredSubjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No subjects match your search.
          </CardContent>
        </Card>
      )}
    </div>
  )
                                   }
