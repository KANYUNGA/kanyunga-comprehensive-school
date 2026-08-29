'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  createSampleData,
  type AttendanceStatus,
  type ClassLevel,
  type Exam,
  type Payment,
  type SchoolData,
  type SchoolInfo,
  type Student,
  type Subject,
  type Teacher,
} from './data'

export type Role = 'admin' | 'parent'
export interface AuthUser {
  role: Role
  name: string
  studentId?: string
}

interface DataContextValue {
  data: SchoolData
  auth: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
  updateSchool: (info: Partial<SchoolInfo>) => void
  addStudent: (s: Omit<Student, 'id'>) => void
  updateStudent: (id: string, patch: Partial<Student>) => void
  deleteStudent: (id: string) => void
  addTeacher: (t: Omit<Teacher, 'id'>) => void
  updateTeacher: (id: string, patch: Partial<Teacher>) => void
  deleteTeacher: (id: string) => void
  addClass: (c: Omit<ClassLevel, 'id'>) => void
  addSubject: (s: Omit<Subject, 'id'>) => void
  setStudentAttendance: (date: string, records: { studentId: string; status: AttendanceStatus }[]) => void
  setTeacherAttendance: (date: string, records: { teacherId: string; status: AttendanceStatus }[]) => void
  addExam: (e: Omit<Exam, 'id'>) => void
  saveMarks: (examId: string, entries: { studentId: string; subjectId: string; score: number }[]) => void
  addPayment: (p: Omit<Payment, 'id'>) => void
}

const DataContext = createContext<DataContextValue | null>(null)

let counter = 0
function uid(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SchoolData>(() => createSampleData())
  const [auth, setAuth] = useState<AuthUser | null>(null)

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      auth,
      login: (user) => setAuth(user),
      logout: () => setAuth(null),
      updateSchool: (info) => setData((d) => ({ ...d, school: { ...d.school, ...info } })),
      addStudent: (s) => setData((d) => ({ ...d, students: [{ ...s, id: uid('std') }, ...d.students] })),
      updateStudent: (id, patch) =>
        setData((d) => ({ ...d, students: d.students.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      deleteStudent: (id) => setData((d) => ({ ...d, students: d.students.filter((s) => s.id !== id) })),
      addTeacher: (t) => setData((d) => ({ ...d, teachers: [{ ...t, id: uid('tch') }, ...d.teachers] })),
      updateTeacher: (id, patch) =>
        setData((d) => ({ ...d, teachers: d.teachers.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTeacher: (id) => setData((d) => ({ ...d, teachers: d.teachers.filter((t) => t.id !== id) })),
      addClass: (c) => setData((d) => ({ ...d, classes: [...d.classes, { ...c, id: uid('cls') }] })),
      addSubject: (s) => setData((d) => ({ ...d, subjects: [...d.subjects, { ...s, id: uid('sub') }] })),
      setStudentAttendance: (date, records) =>
        setData((d) => {
          const others = d.studentAttendance.filter((a) => a.date !== date || !records.some((r) => r.studentId === a.studentId))
          const next = records.map((r) => ({ id: `att-${r.studentId}-${date}`, studentId: r.studentId, date, status: r.status }))
          return { ...d, studentAttendance: [...others, ...next] }
        }),
      setTeacherAttendance: (date, records) =>
        setData((d) => {
          const others = d.teacherAttendance.filter((a) => a.date !== date || !records.some((r) => r.teacherId === a.teacherId))
          const next = records.map((r) => ({ id: `tatt-${r.teacherId}-${date}`, teacherId: r.teacherId, date, status: r.status }))
          return { ...d, teacherAttendance: [...others, ...next] }
        }),
      addExam: (e) => setData((d) => ({ ...d, exams: [...d.exams, { ...e, id: uid('exm') }] })),
      saveMarks: (examId, entries) =>
        setData((d) => {
          const others = d.marks.filter(
            (m) => m.examId !== examId || !entries.some((e) => e.studentId === m.studentId && e.subjectId === m.subjectId),
          )
          const next = entries.map((e) => ({
            id: `mrk-${examId}-${e.studentId}-${e.subjectId}`,
            examId,
            studentId: e.studentId,
            subjectId: e.subjectId,
            score: e.score,
          }))
          return { ...d, marks: [...others, ...next] }
        }),
      addPayment: (p) => setData((d) => ({ ...d, payments: [{ ...p, id: uid('pay') }, ...d.payments] })),
    }),
    [data, auth],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useSchool() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useSchool must be used within DataProvider')
  return ctx
}
