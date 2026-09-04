"use client"

import { useMemo } from "react"
import { CreditCard, Users, Banknote, AlertCircle } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatKES, feeForStudent } from "@/lib/data"
import { useSchool } from "@/lib/store"

export default function FeesPage() {
  const { auth } = useSchool()
  const router = useRouter()

  useEffect(() => {
    if (auth && auth.role !== 'Admin') {
      router.push('/dashboard')
    }
  }, [auth, router])

  if (!auth || auth.role !== 'Admin') {
    return <div className="p-6 text-red-600 font-medium">Access Denied. Admins only.</div>
  }

  const { data } = useSchool()

  const rows = useMemo(() => {
    return data.students.map((student) => {
      const fee = feeForStudent(data, student.id)
      return {
        student,
        ...fee,
      }
    })
  }, [data])

  const totalExpected = rows.reduce((sum, r) => sum + r.total, 0)
  const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0)
  const totalOutstanding = rows.reduce((sum, r) => sum + r.balance, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fees Management"
        description={`Manage school fees for ${data.school.currentTerm}, ${data.school.currentYear}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expected Fees</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold">
              {formatKES(totalExpected)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-emerald-600">
              {formatKES(totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-destructive">
              {formatKES(totalOutstanding)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Student Fee Balances
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Admission No.</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Class</th>
                  <th className="p-3 text-right">Expected</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map(({ student, total, paid, balance }) => (
                  <tr key={student.id} className="border-b">
                    <td className="p-3">{student.admissionNo}</td>
                    <td className="p-3 font-medium">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="p-3">{student.classId || "—"}</td>
                    <td className="p-3 text-right">{formatKES(total)}</td>
                    <td className="p-3 text-right">{formatKES(paid)}</td>
                    <td className="p-3 text-right font-medium">
                      {formatKES(balance)}
                    </td>
                    <td className="p-3">
                      {balance === 0 ? (
                        <Badge variant="secondary">Paid</Badge>
                      ) : paid > 0 ? (
                        <Badge variant="outline">Partial</Badge>
                      ) : (
                        <Badge variant="destructive">Unpaid</Badge>
                      )}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
