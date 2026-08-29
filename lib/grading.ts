// Kenyan (KCSE-style) grading system

export interface GradeInfo {
  grade: string
  points: number
  remark: string
}

const GRADE_TABLE: { min: number; grade: string; points: number; remark: string }[] = [
  { min: 80, grade: 'A', points: 12, remark: 'Excellent' },
  { min: 75, grade: 'A-', points: 11, remark: 'Excellent' },
  { min: 70, grade: 'B+', points: 10, remark: 'Very Good' },
  { min: 65, grade: 'B', points: 9, remark: 'Very Good' },
  { min: 60, grade: 'B-', points: 8, remark: 'Good' },
  { min: 55, grade: 'C+', points: 7, remark: 'Good' },
  { min: 50, grade: 'C', points: 6, remark: 'Average' },
  { min: 45, grade: 'C-', points: 5, remark: 'Average' },
  { min: 40, grade: 'D+', points: 4, remark: 'Below Average' },
  { min: 35, grade: 'D', points: 3, remark: 'Weak' },
  { min: 30, grade: 'D-', points: 2, remark: 'Weak' },
  { min: 0, grade: 'E', points: 1, remark: 'Poor' },
]

export function getGrade(score: number): GradeInfo {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const row = GRADE_TABLE.find((r) => clamped >= r.min) ?? GRADE_TABLE[GRADE_TABLE.length - 1]
  return { grade: row.grade, points: row.points, remark: row.remark }
}

export function meanGradeFromPoints(averagePoints: number): string {
  const rounded = Math.round(averagePoints)
  const row = GRADE_TABLE.find((r) => r.points <= rounded) ?? GRADE_TABLE[GRADE_TABLE.length - 1]
  // find closest grade for the mean points
  const byPoints = [...GRADE_TABLE].sort(
    (a, b) => Math.abs(a.points - averagePoints) - Math.abs(b.points - averagePoints),
  )
  return byPoints[0]?.grade ?? row.grade
}

export function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50 border-blue-200'
  if (grade.startsWith('C')) return 'text-amber-600 bg-amber-50 border-amber-200'
  if (grade.startsWith('D')) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}
