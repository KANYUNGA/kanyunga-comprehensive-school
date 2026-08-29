'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { SchoolData } from '@/lib/data'
import { attendanceTrend, classDistribution, feeByClass, gradeDistribution } from '@/lib/analytics'

export function AttendanceTrendChart({ data }: { data: SchoolData }) {
  const chartData = attendanceTrend(data)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Trend</CardTitle>
        <CardDescription>Daily student attendance rate (last 5 school days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ rate: { label: 'Attendance %', color: 'var(--chart-1)' } }}
          className="h-[240px] w-full"
        >
          <AreaChart data={chartData} margin={{ left: -12, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="rate"
              type="monotone"
              stroke="var(--color-rate)"
              strokeWidth={2}
              fill="url(#fillRate)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function FeeCollectionChart({ data }: { data: SchoolData }) {
  const chartData = feeByClass(data)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Collection by Class</CardTitle>
        <CardDescription>Collected vs outstanding — {data.school.currentTerm}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            collected: { label: 'Collected', color: 'var(--chart-1)' },
            outstanding: { label: 'Outstanding', color: 'var(--chart-3)' },
          }}
          className="h-[240px] w-full"
        >
          <BarChart data={chartData} margin={{ left: -4, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={48}
              tickFormatter={(v: number) => `${v / 1000}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="collected" stackId="a" fill="var(--color-collected)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="outstanding" stackId="a" fill="var(--color-outstanding)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function ClassDistributionChart({ data }: { data: SchoolData }) {
  const chartData = classDistribution(data)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Students per Class</CardTitle>
        <CardDescription>Enrolment distribution across forms</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ students: { label: 'Students', color: 'var(--chart-2)' } }}
          className="h-[240px] w-full"
        >
          <BarChart data={chartData} margin={{ left: -12, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="students" fill="var(--color-students)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const GRADE_COLORS: Record<string, string> = {
  A: 'var(--chart-5)',
  B: 'var(--chart-1)',
  C: 'var(--chart-2)',
  D: 'var(--chart-3)',
  E: 'var(--chart-4)',
}

export function GradeDistributionChart({ data }: { data: SchoolData }) {
  const chartData = gradeDistribution(data).filter((d) => d.count > 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>Grade distribution — Mid-Term Exam</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ count: { label: 'Entries' } }}
          className="mx-auto aspect-square h-[240px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="grade" />} />
            <Pie data={chartData} dataKey="count" nameKey="grade" innerRadius={55} strokeWidth={3}>
              {chartData.map((entry) => (
                <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {chartData.map((entry) => (
            <div key={entry.grade} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GRADE_COLORS[entry.grade] }} />
              Grade {entry.grade} ({entry.count})
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
