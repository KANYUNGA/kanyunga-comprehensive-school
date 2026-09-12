
'use client'

import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  Users,
} from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSchool } from '@/lib/store'
import { formatKES, feeForStudent, studentName } from '@/lib/data'

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

function normalizeClassName(value: unknown) {
  const name = String(value ?? '')
    .trim()
    .toLowerCase()

  if (name === 'play group' || name === 'playgroup') {
    return 'playgroup'
  }

  if (name === 'preprimary 1' || name === 'pp1') {
    return 'pp1'
  }

  if (name === 'preprimary 2' || name === 'pp2') {
    return 'pp2'
  }

  return name
}

export default function ClassListsPage() {
  const { data } = useSchool()

  const [query, setQuery] = useState('')
  const [openClasses, setOpenClasses] = useState<string[]>([])

  const studentsByClass = useMemo(() => {
    const result: Record<string, typeof data.students> = {}

    for (const className of SCHOOL_CLASSES) {
      const normalizedClass = normalizeClassName(className)

      result[className] = data.students.filter((student) => {
        const studentClassName = normalizeClassName(
          student.className,
        )

        const studentClassId = normalizeClassName(
          student.classId,
        )

        return (
          studentClassName === normalizedClass ||
          studentClassId === normalizedClass
        )
      })
    }

    return result
  }, [data.students])

  function toggleClass(className: string) {
    setOpenClasses((current) => {
      if (current.includes(className)) {
        return current.filter((item) => item !== className)
      }

      return [...current, className]
    })
  }

  function downloadClassList(
    className: string,
    students: typeof data.students,
  ) {
    if (students.length === 0) {
      return
    }

    const headers = [
      'No.',
      'Admission Number',
      'Student Name',
      'Gender',
      'Class',
      'Stream',
      'Guardian',
      'Guardian Phone',
      'Email',
      'Fee Balance',
    ]

    const rows = students.map((student, index) => {
      const fee = feeForStudent(data, student.id)

      return [
        index + 1,
        student.admissionNo,
        studentName(student),
        student.gender ?? '',
        student.className ?? student.classId ?? '',
        student.stream ?? '',
        student.guardianName ?? '',
        student.guardianPhone ?? '',
        student.email ?? '',
        formatKES(fee.balance),
      ]
    })

    const csvEscape = (value: unknown) => {
      const text = String(value ?? '')
      return '"' + text.replace(/"/g, '""') + '"'
    }

    const csv = [
      headers.map(csvEscape).join(','),
      ...rows.map((row) =>
        row.map(csvEscape).join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download =
      className.replace(/\s+/g, '_') +
      '_Class_List.csv'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const filteredClasses = SCHOOL_CLASSES.filter(
    (className) => {
      const search = query.toLowerCase().trim()

      if (!search) {
        return true
      }

      const students = studentsByClass[className]

      return (
        className.toLowerCase().includes(search) ||
        students.some((student) =>
          studentName(student)
            .toLowerCase()
            .includes(search),
        ) ||
        students.some((student) =>
          String(student.admissionNo ?? '')
            .toLowerCase()
            .includes(search),
        )
      )
    },
  )

  const totalStudents = data.students.length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Lists"
        description="Separate student lists for every class from Playgroup to Grade 9."
      />

      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search class, student or admission number..."
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />

            <span>
              {totalStudents} total student
              {totalStudents === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {filteredClasses.map((className) => {
          const students = studentsByClass[className]
          const isOpen =
            openClasses.includes(className)

          return (
            <Card
              key={className}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    toggleClass(className)
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}

                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground">
                      {className}
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      {students.length} student
                      {students.length === 1
                        ? ''
                        : 's'}
                    </p>
                  </div>

                  <Badge
                    variant="secondary"
                    className="ml-auto sm:ml-0"
                  >
                    {students.length}
                  </Badge>
                </button>

                <Button
                  variant="outline"
                  disabled={students.length === 0}
                  onClick={() =>
                    downloadClassList(
                      className,
                      students,
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  Download {className}
                </Button>
              </div>

              {isOpen && (
                <div className="border-t">
                  {students.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No students are registered in{' '}
                      {className}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="px-4 py-3 text-left font-medium">
                              No.
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Admission No.
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Student
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Gender
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Stream
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Guardian
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Phone
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                              Fee Balance
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {students.map(
                            (student, index) => {
                              const fee =
                                feeForStudent(
                                  data,
                                  student.id,
                                )

                              return (
                                <tr
                                  key={student.id}
                                  className="border-b last:border-0 hover:bg-muted/30"
                                >
                                  <td className="px-4 py-3">
                                    {index + 1}
                                  </td>

                                  <td className="px-4 py-3 font-mono text-xs">
                                    {
                                      student.admissionNo
                                    }
                                  </td>

                                  <td className="px-4 py-3 font-medium">
                                    {studentName(
                                      student,
                                    )}
                                  </td>

                                  <td className="px-4 py-3">
                                    {student.gender ||
                                      '—'}
                                  </td>

                                  <td className="px-4 py-3">
                                    {student.stream ||
                                      '—'}
                                  </td>

                                  <td className="px-4 py-3">
                                    {student.guardianName ||
                                      '—'}
                                  </td>

                                  <td className="px-4 py-3">
                                    {student.guardianPhone ||
                                      '—'}
                                  </td>

                                  <td className="px-4 py-3">
                                    {fee.balance ===
                                    0 ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-emerald-50 text-emerald-700"
                                      >
                                        Cleared
                                      </Badge>
                                    ) : (
                                      <span className="font-medium text-destructive">
                                        {formatKES(
                                          fee.balance,
                                        )}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filteredClasses.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />

          <h2 className="font-semibold text-foreground">
            No class lists found
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Try changing your search.
          </p>
        </Card>
      )}
    </div>
  )
}
