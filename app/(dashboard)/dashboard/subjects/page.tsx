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

const CATEGORIES = [
  'Pre-primary',
  'Lower Primary',
  'Upper Primary',
  'Junior School',
] as const

type SubjectCategory = (typeof CATEGORIES)[number]

export default function SubjectsPage() {
  const { data, addSubject, auth } = useSchool()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] =
    useState<SubjectCategory>('Junior School')
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
    return CATEGORIES.map((category) => ({
      category,
      subjects: filteredSubjects.filter(
        (subject) => subject.category === category
      ),
    }))
  }, [filteredSubjects])

  async function handleSave() {
    if (!name.trim() || !code.trim()) return

    await addSubject({
      name: name.trim(),
      code: code.trim(),
      category: category as Subject['category'],
    })

    setName('')
    setCode('')
    setCategory('Junior School')
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects"
        description={`Showing ${filteredSubjects.length} of ${data.subjects.length} subjects.`}
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
                      placeholder="Subject name"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sub-code">Subject code</Label>
                    <Input
                      id="sub-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Subject code"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sub-category">Level</Label>

                    <Select
                      value={category}
                      onValueChange={(value) =>
                        setCategory(value as SubjectCategory)
                      }
                    >
                      <SelectTrigger id="sub-category">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>

                      <SelectContent>
                        {CATEGORIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
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
            {data.subjects.length}
          </Badge>
        </div>
      </Card>

      {grouped.map((group) => (
        <Card key={group.category}>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </span>

              <h2 className="font-heading text-lg font-semibold">
                {group.category}
              </h2>

              <Badge variant="secondary" className="ml-auto">
                {group.subjects.length}
              </Badge>
            </div>

            {group.subjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {group.subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">
                        {subject.name}
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground">
                        {subject.code}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No subjects in this category.
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {data.subjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No subjects found.
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
