'use client'

import Link from 'next/link'
import { CreditCard, LayoutGrid, TrendingUp, UserCog, Users } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import {
  AttendanceTrendChart,
  ClassDistributionChart,
  FeeCollectionChart,
  GradeDistributionChart,
} from '@/components/dashboard-charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSchool } from '@/lib/store'
import { formatKES, studentName } from '@/lib/data'
import { feeSummary, todayAttendanceRate } from '@/lib/analytics'

export default function DashboardPage() {
  const { data } = useSchool()
  const totalStreams = data.classes.reduce((n, c) => n + c.streams.length, 0)
  const attendance = todayAttendanceRate(data)
  const fees = feeSummary(data)
  const collectionRate = fees.expected ? Math.round((fees.collected / fees.expected) * 100) : 0
  const recentPayments = [...data.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome to ${data.school.name}`}
        description="Here's what's happening across the school today."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={data.students.length} icon={Users} hint={`${totalStreams} streams`} />
        <StatCard label="Total Teachers" value={data.teachers.length} icon={UserCog} accent="violet" hint="Teaching staff" />
        <StatCard
          label="Classes"
          value={data.classes.length}
          icon={LayoutGrid}
          accent="amber"
          hint={`${data.subjects.length} subjects offered`}
        />
        <StatCard
          label="Attendance Today"
          value={`${attendance}%`}
          icon={TrendingUp}
          accent="emerald"
          hint="Present & late students"
        />
      </div>

      {/* Fee collection summary banner */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected ({data.school.currentTerm})</p>
              <p className="font-heading text-xl font-bold">{formatKES(fees.expected)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="font-heading text-xl font-bold text-emerald-600">{formatKES(fees.collected)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="font-heading text-xl font-bold text-destructive">{formatKES(fees.outstanding)}</p>
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Collection rate</span>
              <span className="font-semibold text-foreground">{collectionRate}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <AttendanceTrendChart data={data} />
        <FeeCollectionChart data={data} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClassDistributionChart data={data} />
        </div>
        <GradeDistributionChart data={data} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Fee Payments</CardTitle>
          <CardDescription>Latest transactions recorded in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {recentPayments.map((p) => {
            const student = data.students.find((s) => s.id === p.studentId)
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-muted/60"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {student ? student.firstName[0] + student.lastName[0] : '--'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {student ? studentName(student) : 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.reference} · {new Date(p.date).toLocaleDateString('en-KE')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{p.method}</Badge>
                  <span className="text-sm font-semibold text-emerald-600">{formatKES(p.amount)}</span>
                </div>
              </div>
            )
          })}
          <div className="pt-2">
            <Link href="/dashboard/payments" className="text-sm font-medium text-primary hover:underline">
              View all payments →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
