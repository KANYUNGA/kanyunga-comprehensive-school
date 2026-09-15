
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

type DashboardStats = {
  students: number
  teachers: number
  classes: number
  subjects: number
}

export default function DashboardPage() {
  const { data } = useSchool()

  /*
   * These four values come directly from the lightweight
   * /api/dashboard endpoint.
   *
   * This avoids downloading all 412 students and their
   * passport photos just to display dashboard counts.
   */
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
  })

  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadDashboardStats() {
      try {
        setStatsLoading(true)

        const response = await fetch('/api/dashboard', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(
            `/api/dashboard returned HTTP ${response.status}`
          )
        }

        const result = await response.json()

        if (!result?.success) {
          throw new Error(
            result?.error ||
              'Dashboard statistics request failed'
          )
        }

        const nextStats: DashboardStats = {
          students: Number(result.students ?? 0),
          teachers: Number(result.teachers ?? 0),
          classes: Number(result.classes ?? 0),
          subjects: Number(result.subjects ?? 0),
        }

        if (!cancelled) {
          setStats(nextStats)

          console.log(
            'DASHBOARD STATISTICS:',
            nextStats
          )
        }
      } catch (error) {
        console.error(
          'Failed to load dashboard statistics:',
          error
        )
      } finally {
        if (!cancelled) {
          setStatsLoading(false)
        }
      }
    }

    loadDashboardStats()

    return () => {
      cancelled = true
    }
  }, [])

  /*
   * Detailed data from SchoolProvider.
   *
   * These collections are still used by charts, fee
   * calculations and recent payments.
   */
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

  /*
   * Safe data object used by dashboard analytics and charts.
   */
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

  /*
   * Streams are calculated from the detailed class data.
   */
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

      {/* Live database status */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <strong>LIVE DATABASE:</strong>

          <span>
            Students={stats.students}
          </span>

          <span>
            Teachers={stats.teachers}
          </span>

          <span>
            Classes={stats.classes}
          </span>

          <span>
            Subjects={stats.subjects}
          </span>

          {statsLoading && (
            <span className="text-sm text-muted-foreground">
              Loading...
            </span>
          )}
        </div>
      </div>

      {/* Dashboard statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={stats.students}
          icon={Users}
          hint={`${totalStreams} streams`}
        />

        <StatCard
          label="Total Teachers"
          value={stats.teachers}
          icon={UserCog}
          accent="violet"
          hint="Teaching staff"
        />

        <StatCard
          label="Classes"
          value={stats.classes}
          icon={LayoutGrid}
          accent="amber"
          hint={`${stats.subjects} subjects offered`}
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
