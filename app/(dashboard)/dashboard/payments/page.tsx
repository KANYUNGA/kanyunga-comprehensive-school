"use client"

import { useMemo, useState } from "react"
import { Plus, Receipt } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { formatKES, feeForStudent, studentName } from "@/lib/data"
import { useSchool } from "@/lib/store"

export default function PaymentsPage() {
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

  const { data, addPayment } = useSchool()

  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")

  const students = useMemo(() => {
    return [...data.students].sort((a, b) =>
      studentName(a).localeCompare(studentName(b))
    )
  }, [data.students])

  const payments = useMemo(() => {
    return [...data.payments].sort((a, b) =>
      b.date.localeCompare(a.date)
    )
  }, [data.payments])

  function recordPayment() {
    const value = Number(amount)

    if (!studentId || !value || value <= 0) return

    addPayment({
      studentId,
      amount: value,
      date: new Date().toISOString().slice(0, 10),
      term: data.school.currentTerm,
      year: data.school.currentYear,
      method: "Cash",
      reference: reference || `PAY-${Date.now()}`,
    })

    setStudentId("")
    setAmount("")
    setReference("")
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments & Balances"
        description="Record fee payments and review payment history."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Record Payment
            </Button>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Fee Payment</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Student</Label>
                  <Select value={studentId} onValueChange={(value) => setStudentId(value ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.admissionNo} — {studentName(student)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="payment-amount">Amount (KES)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="payment-reference">Reference</Label>
                  <Input
                    id="payment-reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Receipt / transaction reference"
                  />
                </div>

                {studentId && (
                  <div className="rounded-lg border p-3 text-sm">
                    {(() => {
                      const fee = feeForStudent(data, studentId)
                      return (
                        <div className="flex justify-between">
                          <span>Current balance</span>
                          <strong>{formatKES(fee.balance)}</strong>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <Button onClick={recordPayment}>
                  Record Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-5" />
            Payment History
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Reference</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => {
                  const student = data.students.find(
                    (s) => s.id === payment.studentId
                  )

                  return (
                    <tr key={payment.id} className="border-b">
                      <td className="p-3">{payment.date}</td>
                      <td className="p-3 font-medium">
                        {student ? studentName(student) : "Unknown student"}
                      </td>
                      <td className="p-3 font-medium">
                        {formatKES(payment.amount)}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">
                          {payment.method}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {payment.reference || "—"}
                      </td>
                    </tr>
                  )
                })}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No payments recorded yet.
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
