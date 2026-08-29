// Domain types and deterministic sample data for the School Management System

export type Gender = 'Male' | 'Female'
export type Status = 'Active' | 'Inactive'
export type AttendanceStatus = 'Present' | 'Absent' | 'Late'

export interface ClassLevel {
  id: string
  name: string
  streams: string[]
  classTeacherId: string | null
}

export interface Subject {
  id: string
  name: string
  code: string
  category: 'Languages' | 'Sciences' | 'Humanities' | 'Technicals' | 'Mathematics'
}

export interface Student {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  gender: Gender
  classId: string
  stream: string
  dateOfBirth: string
  guardianName: string
  guardianPhone: string
  email: string
  admissionDate: string
  status: Status
}

export interface Teacher {
  id: string
  staffNo: string
  firstName: string
  lastName: string
  gender: Gender
  phone: string
  email: string
  subjectIds: string[]
  employmentDate: string
  status: Status
}

export interface StudentAttendance {
  id: string
  studentId: string
  date: string
  status: AttendanceStatus
}

export interface TeacherAttendance {
  id: string
  teacherId: string
  date: string
  status: AttendanceStatus
}

export interface Exam {
  id: string
  name: string
  term: string
  year: number
  outOf: number
}

export interface Mark {
  id: string
  examId: string
  studentId: string
  subjectId: string
  score: number
}

export interface FeeStructure {
  id: string
  classId: string
  term: string
  year: number
  amount: number
}

export interface Payment {
  id: string
  studentId: string
  amount: number
  date: string
  method: 'M-Pesa' | 'Bank' | 'Cash' | 'Cheque'
  reference: string
  term: string
  year: number
}

export interface SchoolInfo {
  name: string
  motto: string
  poBox: string
  phone: string
  email: string
  currentTerm: string
  currentYear: number
}

export interface SchoolData {
  school: SchoolInfo
  classes: ClassLevel[]
  subjects: Subject[]
  students: Student[]
  teachers: Teacher[]
  studentAttendance: StudentAttendance[]
  teacherAttendance: TeacherAttendance[]
  exams: Exam[]
  marks: Mark[]
  feeStructures: FeeStructure[]
  payments: Payment[]
}

// ---- deterministic helpers ----
const firstNamesMale = ['Brian', 'Kevin', 'John', 'Peter', 'David', 'Samuel', 'Dennis', 'Victor', 'Collins', 'Emmanuel', 'Felix', 'George', 'Isaac', 'Kelvin', 'Martin']
const firstNamesFemale = ['Mary', 'Faith', 'Grace', 'Mercy', 'Joyce', 'Ann', 'Esther', 'Cynthia', 'Lucy', 'Nancy', 'Purity', 'Ruth', 'Sharon', 'Wanjiku', 'Zawadi']
const lastNames = ['Kamau', 'Otieno', 'Mwangi', 'Achieng', 'Wafula', 'Kiptoo', 'Njoroge', 'Auma', 'Chebet', 'Omondi', 'Wanjala', 'Muthoni', 'Kariuki', 'Barasa', 'Cheruiyot', 'Njeri', 'Odhiambo', 'Kiprop', 'Wambui', 'Onyango']

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

const SUBJECTS: Subject[] = [
  { id: 'sub-eng', name: 'English', code: '101', category: 'Languages' },
  { id: 'sub-kis', name: 'Kiswahili', code: '102', category: 'Languages' },
  { id: 'sub-mat', name: 'Mathematics', code: '121', category: 'Mathematics' },
  { id: 'sub-bio', name: 'Biology', code: '231', category: 'Sciences' },
  { id: 'sub-phy', name: 'Physics', code: '232', category: 'Sciences' },
  { id: 'sub-che', name: 'Chemistry', code: '233', category: 'Sciences' },
  { id: 'sub-his', name: 'History & Govt', code: '311', category: 'Humanities' },
  { id: 'sub-geo', name: 'Geography', code: '312', category: 'Humanities' },
  { id: 'sub-cre', name: 'C.R.E', code: '313', category: 'Humanities' },
  { id: 'sub-bst', name: 'Business Studies', code: '565', category: 'Technicals' },
  { id: 'sub-agr', name: 'Agriculture', code: '443', category: 'Technicals' },
  { id: 'sub-com', name: 'Computer Studies', code: '451', category: 'Technicals' },
]

const CLASS_DEFS = [
  { id: 'cls-f1', name: 'Form 1', streams: ['North', 'South'] },
  { id: 'cls-f2', name: 'Form 2', streams: ['North', 'South'] },
  { id: 'cls-f3', name: 'Form 3', streams: ['East', 'West'] },
  { id: 'cls-f4', name: 'Form 4', streams: ['East', 'West'] },
]

function isoDaysAgo(days: number): string {
  const d = new Date('2026-08-28T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

const FEE_BY_CLASS: Record<string, number> = {
  'cls-f1': 45000,
  'cls-f2': 45000,
  'cls-f3': 53000,
  'cls-f4': 53000,
}

export function createSampleData(): SchoolData {
  const school: SchoolInfo = {
    name: 'Kanyunga Comprehensive School',
    motto: 'Education for Excellence',
    poBox: 'P.O. Box 245-40100, Kisumu',
    phone: '+254 712 345 678',
    email: 'info@kanyunga.ac.ke',
    currentTerm: 'Term 2',
    currentYear: 2026,
  }

  const teachers: Teacher[] = Array.from({ length: 16 }).map((_, i) => {
    const gender: Gender = i % 2 === 0 ? 'Male' : 'Female'
    const first = gender === 'Male' ? pick(firstNamesMale, i + 3) : pick(firstNamesFemale, i + 5)
    const last = pick(lastNames, i + 7)
    const subj1 = SUBJECTS[i % SUBJECTS.length]
    const subj2 = SUBJECTS[(i + 4) % SUBJECTS.length]
    return {
      id: `tch-${i + 1}`,
      staffNo: `TSC/${10230 + i}`,
      firstName: first,
      lastName: last,
      gender,
      phone: `+2547${(11000000 + i * 137891).toString().slice(0, 8)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@kanyunga.ac.ke`,
      subjectIds: subj1.id === subj2.id ? [subj1.id] : [subj1.id, subj2.id],
      employmentDate: `20${18 + (i % 6)}-01-15`,
      status: 'Active',
    }
  })

  const classes: ClassLevel[] = CLASS_DEFS.map((c, idx) => ({
    id: c.id,
    name: c.name,
    streams: c.streams,
    classTeacherId: teachers[idx * 2]?.id ?? null,
  }))

  // students: ~14 per class (7 per stream)
  const students: Student[] = []
  let adm = 1001
  classes.forEach((cls, ci) => {
    cls.streams.forEach((stream, si) => {
      for (let n = 0; n < 8; n++) {
        const idx = ci * 100 + si * 10 + n
        const gender: Gender = idx % 2 === 0 ? 'Male' : 'Female'
        const first = gender === 'Male' ? pick(firstNamesMale, idx) : pick(firstNamesFemale, idx + 2)
        const last = pick(lastNames, idx + ci + si)
        const guardianFirst = pick(gender === 'Male' ? firstNamesFemale : firstNamesMale, idx + 9)
        students.push({
          id: `std-${adm}`,
          admissionNo: `KCS-${adm}`,
          firstName: first,
          lastName: last,
          gender,
          classId: cls.id,
          stream,
          dateOfBirth: `20${9 + ci}-0${(idx % 9) + 1}-1${idx % 9}`,
          guardianName: `${guardianFirst} ${last}`,
          guardianPhone: `+2547${(22000000 + idx * 91237).toString().slice(0, 8)}`,
          email: `${first.toLowerCase()}${adm}@gmail.com`,
          admissionDate: `20${23 + (ci % 3)}-01-08`,
          status: 'Active',
        })
        adm++
      }
    })
  })

  // exams
  const exams: Exam[] = [
    { id: 'exm-1', name: 'Opener Exam', term: 'Term 2', year: 2026, outOf: 100 },
    { id: 'exm-2', name: 'Mid-Term Exam', term: 'Term 2', year: 2026, outOf: 100 },
    { id: 'exm-3', name: 'End of Term 1', term: 'Term 1', year: 2026, outOf: 100 },
  ]

  // marks: for exm-2 (mid-term), every student gets marks in 8 core subjects
  const coreSubjects = ['sub-eng', 'sub-kis', 'sub-mat', 'sub-bio', 'sub-che', 'sub-his', 'sub-geo', 'sub-bst']
  const marks: Mark[] = []
  students.forEach((s, si) => {
    coreSubjects.forEach((subId, sj) => {
      // deterministic pseudo-random score 35-92
      const seed = (si * 31 + sj * 17 + s.admissionNo.length * 13) % 58
      const score = 35 + seed
      marks.push({
        id: `mrk-${s.id}-${subId}`,
        examId: 'exm-2',
        studentId: s.id,
        subjectId: subId,
        score,
      })
    })
  })

  // student attendance for the last 5 school days
  const studentAttendance: StudentAttendance[] = []
  const attendanceDays = [1, 2, 3, 4, 5].map((d) => isoDaysAgo(d))
  students.forEach((s, si) => {
    attendanceDays.forEach((date, di) => {
      const roll = (si * 7 + di * 3) % 20
      const status: AttendanceStatus = roll === 0 ? 'Absent' : roll === 1 ? 'Late' : 'Present'
      studentAttendance.push({ id: `att-${s.id}-${date}`, studentId: s.id, date, status })
    })
  })

  // teacher attendance for last 5 days
  const teacherAttendance: TeacherAttendance[] = []
  teachers.forEach((t, ti) => {
    attendanceDays.forEach((date, di) => {
      const roll = (ti * 5 + di * 2) % 15
      const status: AttendanceStatus = roll === 0 ? 'Absent' : roll === 1 ? 'Late' : 'Present'
      teacherAttendance.push({ id: `tatt-${t.id}-${date}`, teacherId: t.id, date, status })
    })
  })

  // fee structures for current term
  const feeStructures: FeeStructure[] = classes.map((c) => ({
    id: `fee-${c.id}`,
    classId: c.id,
    term: school.currentTerm,
    year: school.currentYear,
    amount: FEE_BY_CLASS[c.id] ?? 45000,
  }))

  // payments: most students paid part of their fees
  const payments: Payment[] = []
  students.forEach((s, si) => {
    const total = FEE_BY_CLASS[s.classId] ?? 45000
    const ratioSeed = (si * 13) % 100
    const ratio = ratioSeed < 15 ? 1 : ratioSeed < 70 ? 0.6 : 0.3
    const paid = Math.round((total * ratio) / 500) * 500
    if (paid > 0) {
      const methods: Payment['method'][] = ['M-Pesa', 'Bank', 'Cash', 'Cheque']
      payments.push({
        id: `pay-${s.id}-1`,
        studentId: s.id,
        amount: paid,
        date: isoDaysAgo((si % 25) + 1),
        method: methods[si % methods.length],
        reference: `RCP${5000 + si}`,
        term: school.currentTerm,
        year: school.currentYear,
      })
    }
  })

  return {
    school,
    classes,
    subjects: SUBJECTS,
    students,
    teachers,
    studentAttendance,
    teacherAttendance,
    exams,
    marks,
    feeStructures,
    payments,
  }
}

// ---- selectors / helpers ----
export function studentName(s: Pick<Student, 'firstName' | 'lastName'>): string {
  return `${s.firstName} ${s.lastName}`
}

export function teacherName(t: Pick<Teacher, 'firstName' | 'lastName'>): string {
  return `${t.firstName} ${t.lastName}`
}

export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`
}

export function feeForStudent(data: SchoolData, studentId: string) {
  const student = data.students.find((s) => s.id === studentId)
  if (!student) return { total: 0, paid: 0, balance: 0 }
  const structure = data.feeStructures.find(
    (f) => f.classId === student.classId && f.term === data.school.currentTerm && f.year === data.school.currentYear,
  )
  const total = structure?.amount ?? 0
  const paid = data.payments
    .filter((p) => p.studentId === studentId && p.term === data.school.currentTerm && p.year === data.school.currentYear)
    .reduce((sum, p) => sum + p.amount, 0)
  return { total, paid, balance: Math.max(0, total - paid) }
}
