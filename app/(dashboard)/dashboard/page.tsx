
'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import {
  CreditCard,
  LayoutGrid,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'

import {
  AttendanceTrendChart,
  ClassDistributionChart,
  FeeCollectionChart,
  GradeDistributionChart,
} from '@/components/dashboard-charts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import { useSchool } from '@/lib/store'
import { formatKES, studentName } from '@/lib/data'
import {
  feeSummary,
  todayAttendanceRate,
} from '@/lib/analytics'

export default function DashboardPage() {
  const { data } = useSchool()

  /*
   * TEMPORARY DIAGNOSTIC
   *
   * This tells us whether the Dashboard receives
   * the updated database data after SchoolProvider
   * finishes loading.
   */
  useEffect(() => {
    console.log('DASHBOARD DATA UPDATED:', {
      students: data.students?.length ?? 0,
      teachers: data.teachers?.length ?? 0,
      classes: data.classes?.length ?? 0,
      subjects: data.subjects?.length ?? 0,
      payments: data.payments?.length ?? 0,
      attendance: data.attendance?.length ?? 0,
      fees: data.fees?.length ?? 0,
    })
  }, [data])

  console.log('DASHBOARD DATA:', {
    students: data.students?.length ?? 0,
    teachers: data.teachers?.length ?? 0,
    classes: data.classes?.length ?? 0,
    subjects: data.subjects?.length ?? 0,
    payments: data.payments?.length ?? 0,
    attendance: data.attendance?.length ?? 0,
    fees: data.fees?.length ?? 0,
  })

  // Safely guarantee that all dashboard collections are arrays.
  const students = Array.isArray(data.students)
    ? data.students
    : []

  const teachers = Array.isArray(data.teachers)
    ? data.teachers
    : []

  const classes = Array.isArray(data.classes)
    ? data.classes
    : []

  const subjects = Array.isArray(data.subjects)
    ? data.subjects
    : []

  const payments = Array.isArray(data.payments)
    ? data.payments
    : []

  const attendanceRecords = Array.isArray(
    data.attendance
  )
    ? data.attendance
    : []

  const feesData = Array.isArray(data.fees)
    ? data.fees
    : []

  // Safe version of the school data used by analytics and charts.
  const safeData = {
    ...data,
    students,
    teachers,
    classes,
    subjects,
    payments,
    attendance: attendanceRecords,
    fees: feesData,
  }

  const totalStreams = classes.reduce(
    (n, c) =>
      n +
      (Array.isArray(c.streams)
        ? c.streams.length
        : 0),
    0
  )

  const attendance =
    todayAttendanceRate(safeData)

  const fees = feeSummary(safeData)

  const collectionRate = fees.expected
    ? Math.round(
        (fees.collected / fees.expected) * 100
      )
    : 0

  const recentPayments = [...payments]
    .sort((a, b) =>
      b.date.localeCompare(a.date)
    )
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome to ${data.school.name}`}
        description="Here's what's happening across the school today."
      />

      <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-black">
  <strong>LIVE DATABASE TEST:</strong>{' '}
  Students={students.length} | Teachers={teachers.length} | Classes={classes.length} | Subjects={subjects.length}
</div>
      {/* Dashboard statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={students.length}
          icon={Users}
          hint={`${totalStreams} streams`}
        />

        <StatCard
          label="Total Teachers"
          value={teachers.length}
          icon={UserCog}
          accent="violet"
          hint="Teaching staff"
        />

        <StatCard
          label="Classes"
          value={classes.length}
          icon={LayoutGrid}
          accent="amber"
          hint={`${subjects.length} subjects offered`}
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
              <p className="text-sm text-muted-foreground">
                Expected ({data.school.currentTerm})
              </p>

              <p className="font-heading text-xl font-bold">
                {formatKES(fees.expected)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Collected
            </p>

            <p className="font-heading text-xl font-bold text-emerald-600">
              {formatKES(fees.collected)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Outstanding
            </p>

            <p className="font-heading text-xl font-bold text-destructive">
              {formatKES(fees.outstanding)}
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Collection rate
              </span>

              <span className="font-semibold text-foreground">
                {collectionRate}%
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${collectionRate}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttendanceTrendChart data={safeData} />
        <FeeCollectionChart data={safeData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClassDistributionChart
            data={safeData}
          />
        </div>

        <GradeDistributionChart
          data={safeData}
        />
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle>
            Recent Fee Payments
          </CardTitle>

          <CardDescription>
            Latest transactions recorded in the system
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-1">
          {recentPayments.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No fee payments recorded yet.
            </div>
          ) : (
            recentPayments.map((p) => {
              const student =
                students.find(
                  (s) =>
                    s.id === p.studentId
                )

              const initials = student
                ? `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`
                : '--'

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-muted/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials || '--'}
                    </span>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {student
                          ? studentName(student)
                          : 'Unknown'}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {p.reference} ·{' '}
                        {new Date(
                          p.date
                        ).toLocaleDateString(
                          'en-KE'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {p.method}
                    </Badge>

                    <span className="text-sm font-semibold text-emerald-600">
                      {formatKES(p.amount)}
                    </span>
                  </div>
                </div>
              )
            })
          )}

          <div className="pt-2">
            <Link
              href="/dashboard/payments"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all payments →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
