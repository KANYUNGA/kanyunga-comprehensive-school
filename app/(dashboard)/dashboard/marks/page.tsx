"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"

type Mark = {
  id: string
  examId: string
  studentId: string
  subjectId: string
  score: number
}

export default function MarksPage() {
  const [marks, setMarks] = useState<Mark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/marks")
      .then((res) => res.json())
      .then((data) => setMarks(Array.isArray(data) ? data : []))
      .catch(() => setMarks([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marks Management"
        description="View and manage student examination marks."
      />

      <Card>
        <CardHeader>
          <CardTitle>Student Marks</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading marks...</p>
          ) : marks.length === 0 ? (
            <p className="text-muted-foreground">No marks recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Exam ID</th>
                    <th className="p-3">Subject ID</th>
                    <th className="p-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((mark) => (
                    <tr key={mark.id} className="border-b">
                      <td className="p-3">{mark.studentId}</td>
                      <td className="p-3">{mark.examId}</td>
                      <td className="p-3">{mark.subjectId}</td>
                      <td className="p-3 text-right font-medium">
                        {mark.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
