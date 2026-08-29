import { feeForStudent, type SchoolData } from './data'
import { getGrade } from './grading'

export function attendanceTrend(data: SchoolData) {
  const byDate = new Map<string, { present: number; total: number }>()
  for (const a of data.studentAttendance) {
    const entry = byDate.get(a.date) ?? { present: 0, total: 0 }
    entry.total += 1
    if (a.status === 'Present' || a.status === 'Late') entry.present += 1
    byDate.set(a.date, entry)
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({
      date: new Date(date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric' }),
      rate: v.total ? Math.round((v.present / v.total) * 100) : 0,
    }))
}

export function todayAttendanceRate(data: SchoolData) {
  const dates = [...new Set(data.studentAttendance.map((a) => a.date))].sort()
  const latest = dates[dates.length - 1]
  const records = data.studentAttendance.filter((a) => a.date === latest)
  if (!records.length) return 0
  const present = records.filter((a) => a.status === 'Present' || a.status === 'Late').length
  return Math.round((present / records.length) * 100)
}

export function classDistribution(data: SchoolData) {
  return data.classes.map((c) => ({
    name: c.name,
    students: data.students.filter((s) => s.classId === c.id).length,
  }))
}

export function gradeDistribution(data: SchoolData) {
  const buckets: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
  for (const m of data.marks) {
    const g = getGrade(m.score).grade[0]
    if (buckets[g] !== undefined) buckets[g] += 1
  }
  return Object.entries(buckets).map(([grade, count]) => ({ grade, count }))
}

export function feeSummary(data: SchoolData) {
  let expected = 0
  let collected = 0
  for (const s of data.students) {
    const { total, paid } = feeForStudent(data, s.id)
    expected += total
    collected += Math.min(paid, total)
  }
  return { expected, collected, outstanding: Math.max(0, expected - collected) }
}

export function feeByClass(data: SchoolData) {
  return data.classes.map((c) => {
    const students = data.students.filter((s) => s.classId === c.id)
    let expected = 0
    let collected = 0
    for (const s of students) {
      const f = feeForStudent(data, s.id)
      expected += f.total
      collected += Math.min(f.paid, f.total)
    }
    return { name: c.name, collected, outstanding: Math.max(0, expected - collected) }
  })
}
