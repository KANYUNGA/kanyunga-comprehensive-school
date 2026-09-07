'use client'

import { useMemo, useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  Printer,
  Search,
  Users,
} from 'lucide-react'

import { useSchool } from '@/lib/store'
import type { Student, Subject } from '@/lib/data'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

type ClassCategory =
  | 'Pre-primary'
  | 'Lower Primary'
  | 'Upper Primary'
  | 'Junior School'

function categoryForClass(className: string): ClassCategory {
  if (
    className === 'Play Group' ||
    className === 'PP1' ||
    className === 'PP2'
  ) {
    return 'Pre-primary'
  }

  if (
    className === 'Grade 1' ||
    className === 'Grade 2' ||
    className === 'Grade 3'
  ) {
    return 'Lower Primary'
  }

  if (
    className === 'Grade 4' ||
    className === 'Grade 5' ||
    className === 'Grade 6'
  ) {
    return 'Upper Primary'
  }

  return 'Junior School'
}

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function studentFullName(student: Student) {
  return `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim()
}

function sortSubjects(subjects: Subject[]) {
  return [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

export default function ClassListsPage() {
  const { data } = useSchool()

  const [selectedClass, setSelectedClass] =
    useState('Play Group')

  const [search, setSearch] = useState('')

  const selectedCategory =
    categoryForClass(selectedClass)

  const classStudents = useMemo(() => {
    const term = search.trim().toLowerCase()

    return data.students
      .filter((student) => {
        const studentClass = String(
          student.classId ?? ''
        )
          .trim()
          .toLowerCase()

        return (
          studentClass ===
          selectedClass.trim().toLowerCase()
        )
      })
      .filter((student) => {
        if (!term) return true

        return (
          studentFullName(student)
            .toLowerCase()
            .includes(term) ||
          String(student.admissionNo ?? '')
            .toLowerCase()
            .includes(term)
        )
      })
      .sort((a, b) =>
        studentFullName(a).localeCompare(
          studentFullName(b)
        )
      )
  }, [data.students, selectedClass, search])

  const classSubjects = useMemo(() => {
    const subjects = data.subjects.filter(
      (subject) =>
        subject.category === selectedCategory
    )

    return sortSubjects(subjects)
  }, [data.subjects, selectedCategory])

  function downloadMarksSheet() {
    if (classStudents.length === 0) {
      return
    }

    const headers = [
      'No.',
      'Admission Number',
      'Student Name',
      'Gender',
      ...classSubjects.map(
        (subject) => subject.name
      ),
    ]

    const rows = classStudents.map(
      (student, index) => [
        index + 1,
        student.admissionNo ?? '',
        studentFullName(student),
        student.gender ?? '',
        ...classSubjects.map(() => ''),
      ]
    )

    const csv = [
      [`${selectedClass} Marks Sheet`],
      [`Learning Level: ${selectedCategory}`],
      [`Students: ${classStudents.length}`],
      [],
      headers,
      ...rows,
    ]
      .map((row) =>
        row.map(csvEscape).join(',')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download =
      `${selectedClass.replace(/\s+/g, '_')}_Marks_Sheet.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  function downloadAllClassLists() {
    SCHOOL_CLASSES.forEach((className) => {
      const students = data.students
        .filter(
          (student) =>
            String(student.classId ?? '')
              .trim()
              .toLowerCase() ===
            className.trim().toLowerCase()
        )
        .sort((a, b) =>
          studentFullName(a).localeCompare(
            studentFullName(b)
          )
        )

      const category =
        categoryForClass(className)

      const subjects = sortSubjects(
        data.subjects.filter(
          (subject) =>
            subject.category === category
        )
      )

      if (students.length === 0) {
        return
      }

      const headers = [
        'No.',
        'Admission Number',
        'Student Name',
        'Gender',
        ...subjects.map(
          (subject) => subject.name
        ),
      ]

      const rows = students.map(
        (student, index) => [
          index + 1,
          student.admissionNo ?? '',
          studentFullName(student),
          student.gender ?? '',
          ...subjects.map(() => ''),
        ]
      )

      const csv = [
        [`${className} Marks Sheet`],
        [`Learning Level: ${category}`],
        [`Students: ${students.length}`],
        [],
        headers,
        ...rows,
      ]
        .map((row) =>
          row.map(csvEscape).join(',')
        )
        .join('\n')

      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download =
        `${className.replace(/\s+/g, '_')}_Marks_Sheet.csv`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    })
  }

  function printClassList() {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Class Lists"
        description="View each class separately with learning areas and subjects for manual marks entry."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={printClassList}
              disabled={classStudents.length === 0}
            >
              <Printer className="size-4" />
              Print
            </Button>

            <Button
              variant="outline"
              onClick={downloadAllClassLists}
              disabled={data.students.length === 0}
            >
              <FileSpreadsheet className="size-4" />
              Download All Classes
            </Button>

            <Button
              onClick={downloadMarksSheet}
              disabled={classStudents.length === 0}
            >
              <Download className="size-4" />
              Download Marks Sheet
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Class
              </label>

              <Select
                value={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(
                    value || 'Play Group'
                  )
                  setSearch('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>

                <SelectContent>
                  {SCHOOL_CLASSES.map(
                    (className) => (
                      <SelectItem
                        key={className}
                        value={className}
                      >
                        {className}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Search Students
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  className="pl-9"
                  placeholder="Search name or admission number..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex items-end">
              <Badge
                variant="secondary"
                className="h-10 px-4"
              >
                <Users className="mr-2 size-4" />
                {classStudents.length} Students
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>
                {selectedClass} Class List
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {selectedCategory} ·{' '}
                {classSubjects.length} learning areas /
                subjects
              </p>
            </div>

            <Badge
              variant="outline"
              className="sm:ml-auto"
            >
              {classStudents.length} students
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {classStudents.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Users className="mx-auto mb-3 size-10 text-muted-foreground/50" />

              <h3 className="font-medium">
                No students found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                There are no students registered in{' '}
                {selectedClass}
                {search
                  ? ' matching your search.'
                  : '.'}
              </p>
            </div>
          ) : classSubjects.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <FileSpreadsheet className="mx-auto mb-3 size-10 text-muted-foreground/50" />

              <h3 className="font-medium">
                No subjects found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Add subjects under the Subjects page
                for the {selectedCategory} level.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      No.
                    </TableHead>

                    <TableHead className="min-w-32">
                      Admission No.
                    </TableHead>

                    <TableHead className="min-w-48">
                      Student Name
                    </TableHead>

                    <TableHead className="min-w-24">
                      Gender
                    </TableHead>

                    {classSubjects.map(
                      (subject) => (
                        <TableHead
                          key={subject.id}
                          className="min-w-32 text-center"
                        >
                          <div>
                            {subject.name}
                          </div>

                          <div className="text-[10px] font-normal text-muted-foreground">
                            {subject.code}
                          </div>
                        </TableHead>
                      )
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {classStudents.map(
                    (student, index) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-center font-medium">
                          {index + 1}
                        </TableCell>

                        <TableCell className="font-mono text-xs">
                          {student.admissionNo}
                        </TableCell>

                        <TableCell className="font-medium">
                          {studentFullName(student)}
                        </TableCell>

                        <TableCell>
                          {student.gender || '—'}
                        </TableCell>

                        {classSubjects.map(
                          (subject) => (
                            <TableCell
                              key={subject.id}
                              className="h-12 border-l text-center"
                            >
                              <span className="text-muted-foreground/30">
                                —
                              </span>
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="print-only">
        <CardContent className="pt-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">
              {data.school.name}
            </h1>

            <h2 className="mt-2 text-xl font-semibold">
              {selectedClass} Marks Sheet
            </h2>

            <p className="text-sm">
              {selectedCategory}
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Student Name</TableHead>

                  {classSubjects.map(
                    (subject) => (
                      <TableHead
                        key={subject.id}
                        className="text-center"
                      >
                        {subject.name}
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {classStudents.map(
                  (student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        {student.admissionNo}
                      </TableCell>

                      <TableCell>
                        {studentFullName(student)}
                      </TableCell>

                      {classSubjects.map(
                        (subject) => (
                          <TableCell
                            key={subject.id}
                            className="h-12"
                          />
                        )
                      )}
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        .print-only {
          display: none;
        }

        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .print-only,
          .print-only * {
            visibility: visible;
          }

          .print-only {
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          @page {
            size: landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  )
}

