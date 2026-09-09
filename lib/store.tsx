'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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

export type Role = 'admin' | 'teacher' | 'parent'

export interface AuthUser {
  role: Role
  name: string
  studentId?: string
}

type StudentWithPhoto = Student & {
  photoUrl?: string
}

interface DataContextValue {
  data: SchoolData
  auth: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
  updateSchool: (info: Partial<SchoolInfo>) => void

  addStudent: (s: Omit<StudentWithPhoto, 'id'>) => Promise<void>
  updateStudent: (
    id: string,
    patch: Partial<StudentWithPhoto>
  ) => Promise<void>
  deleteStudent: (id: string) => Promise<void>

  addTeacher: (t: Omit<Teacher, 'id'>) => Promise<void>
  updateTeacher: (id: string, patch: Partial<Teacher>) => Promise<void>
  deleteTeacher: (id: string) => Promise<void>

  addClass: (c: Omit<ClassLevel, 'id'>) => Promise<void>
  addSubject: (s: Omit<Subject, 'id'>) => Promise<void>

  setStudentAttendance: (
    date: string,
    records: { studentId: string; status: AttendanceStatus }[]
  ) => void

  setTeacherAttendance: (
    date: string,
    records: { teacherId: string; status: AttendanceStatus }[]
  ) => void

  addExam: (e: Omit<Exam, 'id'>) => Promise<void>

  saveMarks: (
    examId: string,
    entries: {
      studentId: string
      subjectId: string
      score: number
    }[]
  ) => Promise<void>

  addPayment: (p: Omit<Payment, 'id'>) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SchoolData>(() => createSampleData())
  const [auth, setAuth] = useState<AuthUser | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [
          studentsResponse,
          paymentsResponse,
          feesResponse,
          teachersResponse,
          classesResponse,
          subjectsResponse,
          examsResponse,
          marksResponse,
        ] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/payments'),
          fetch('/api/fees'),
          fetch('/api/teachers'),
          fetch('/api/classes'),
          fetch('/api/subjects'),
          fetch('/api/exams'),
          fetch('/api/marks'),
        ])

        if (!studentsResponse.ok) {
          throw new Error('Failed to load students')
        }

        if (!paymentsResponse.ok) {
          throw new Error('Failed to load payments')
        }

        if (!feesResponse.ok) {
          throw new Error('Failed to load fees')
        }

        if (!teachersResponse.ok) {
          throw new Error('Failed to load teachers')
        }

        if (!classesResponse.ok) {
          throw new Error('Failed to load classes')
        }

        if (!marksResponse.ok) {
          throw new Error('Failed to load marks')
        }

        const students = (await studentsResponse.json()) as StudentWithPhoto[]
        const payments = await paymentsResponse.json()
        const fees = await feesResponse.json()
        const teachers = await teachersResponse.json()
        const classes = await classesResponse.json()
        const subjects = await subjectsResponse.json()
        const exams = await examsResponse.json()
        const marks = await marksResponse.json()

        setData((current) => ({
          ...current,

          // Keep photoUrl exactly as returned by the API.
          students: students.map((student) => ({
            ...student,
            photoUrl: student.photoUrl || '',
          })),

          payments,

          feeStructures: fees.map(
            (fee: {
              id: string
              studentId: string
              term: string
              year: number
              amountRequired: number
            }) => ({
              id: fee.id,
              classId: fee.studentId,
              term: fee.term,
              year: fee.year,
              amount: fee.amountRequired,
            })
          ),

          teachers,
          classes,
          subjects,
          exams,
          marks,
        }))
      } catch (error) {
        console.error('Failed to load school data:', error)
      }
    }

    loadData()
  }, [])

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      auth,

      login: (user) => setAuth(user),

      logout: () => setAuth(null),

      updateSchool: (info) =>
        setData((d) => ({
          ...d,
          school: {
            ...d.school,
            ...info,
          },
        })),

      addStudent: async (s) => {
        try {
          const response = await fetch('/api/students', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(s),
          })

          if (!response.ok) {
            throw new Error('Failed to save student')
          }

          const responseData = await fetch('/api/students')

          if (!responseData.ok) {
            throw new Error('Failed to reload students')
          }

          const students =
            (await responseData.json()) as StudentWithPhoto[]

          setData((d) => ({
            ...d,
            students: students.map((student) => ({
              ...student,
              photoUrl: student.photoUrl || '',
            })),
          }))
        } catch (error) {
          console.error('Failed to add student:', error)
          throw error
        }
      },

      updateStudent: async (id, patch) => {
        try {
          const response = await fetch(`/api/students/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(patch),
          })

          if (!response.ok) {
            throw new Error('Failed to update student')
          }

          const updated =
            (await response.json()) as StudentWithPhoto

          setData((d) => ({
            ...d,
            students: d.students.map((s) =>
              s.id === id
                ? {
                    ...updated,
                    photoUrl: updated.photoUrl || '',
                  }
                : s
            ),
          }))
        } catch (error) {
          console.error('Failed to update student:', error)
          throw error
        }
      },

      deleteStudent: async (id) => {
        try {
          const response = await fetch(`/api/students/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete student')
          }

          setData((d) => ({
            ...d,
            students: d.students.filter((s) => s.id !== id),
          }))
        } catch (error) {
          console.error('Failed to delete student:', error)
          throw error
        }
      },

      addTeacher: async (t) => {
        try {
          const response = await fetch('/api/teachers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(t),
          })

          if (!response.ok) {
            throw new Error('Failed to save teacher')
          }

          const teacher = await response.json()

          setData((d) => ({
            ...d,
            teachers: [teacher, ...d.teachers],
          }))
        } catch (error) {
          console.error('Failed to add teacher:', error)
          throw error
        }
      },

      updateTeacher: async (id, patch) => {
        try {
          const currentTeacher = data.teachers.find(
            (t) => t.id === id
          )

          if (!currentTeacher) {
            throw new Error('Teacher not found')
          }

          const updatedTeacher = {
            ...currentTeacher,
            ...patch,
            id,
          }

          const response = await fetch(`/api/teachers/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTeacher),
          })

          if (!response.ok) {
            throw new Error('Failed to update teacher')
          }

          const updated = await response.json()

          setData((d) => ({
            ...d,
            teachers: d.teachers.map((t) =>
              t.id === id ? updated : t
            ),
          }))
        } catch (error) {
          console.error('Failed to update teacher:', error)
          throw error
        }
      },

      deleteTeacher: async (id) => {
        try {
          const response = await fetch(`/api/teachers/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete teacher')
          }

          setData((d) => ({
            ...d,
            teachers: d.teachers.filter((t) => t.id !== id),
          }))
        } catch (error) {
          console.error('Failed to delete teacher:', error)
          throw error
        }
      },

      addClass: async (c) => {
        try {
          const response = await fetch('/api/classes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(c),
          })

          if (!response.ok) {
            throw new Error('Failed to save class')
          }

          const classData = await response.json()

          setData((d) => ({
            ...d,
            classes: [...d.classes, classData],
          }))
        } catch (error) {
          console.error('Failed to add class:', error)
          throw error
        }
      },

      addSubject: async (s) => {
        try {
          const response = await fetch('/api/subjects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(s),
          })

          if (!response.ok) {
            throw new Error('Failed to save subject')
          }

          const subject = await response.json()

          setData((d) => ({
            ...d,
            subjects: [...d.subjects, subject],
          }))
        } catch (error) {
          console.error('Failed to add subject:', error)
          throw error
        }
      },

      setStudentAttendance: (date, records) =>
        setData((d) => {
          const others = d.studentAttendance.filter(
            (a) =>
              a.date !== date ||
              !records.some(
                (r) => r.studentId === a.studentId
              )
          )

          const next = records.map((r) => ({
            id: `att-${r.studentId}-${date}`,
            studentId: r.studentId,
            date,
            status: r.status,
          }))

          return {
            ...d,
            studentAttendance: [...others, ...next],
          }
        }),

      setTeacherAttendance: (date, records) =>
        setData((d) => {
          const others = d.teacherAttendance.filter(
            (a) =>
              a.date !== date ||
              !records.some(
                (r) => r.teacherId === a.teacherId
              )
          )

          const next = records.map((r) => ({
            id: `tatt-${r.teacherId}-${date}`,
            teacherId: r.teacherId,
            date,
            status: r.status,
          }))

          return {
            ...d,
            teacherAttendance: [...others, ...next],
          }
        }),

      addExam: async (e) => {
        try {
          const response = await fetch('/api/exams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(e),
          })

          if (!response.ok) {
            throw new Error('Failed to save exam')
          }

          const responseData = await fetch('/api/exams')

          if (!responseData.ok) {
            throw new Error('Failed to reload exams')
          }

          const exams = await responseData.json()

          setData((current) => ({
            ...current,
            exams,
          }))
        } catch (error) {
          console.error('Failed to add exam:', error)
          throw error
        }
      },

      saveMarks: async (examId, entries) => {
        try {
          const response = await fetch('/api/marks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              examId,
              entries,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to save marks')
          }

          const responseData = await fetch('/api/marks')

          if (!responseData.ok) {
            throw new Error('Failed to reload marks')
          }

          const marks = await responseData.json()

          setData((current) => ({
            ...current,
            marks,
          }))
        } catch (error) {
          console.error('Failed to save marks:', error)
          throw error
        }
      },

      addPayment: async (p) => {
        try {
          const response = await fetch('/api/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(p),
          })

          if (!response.ok) {
            throw new Error('Failed to save payment')
          }

          const responseData = await fetch('/api/payments')

          if (!responseData.ok) {
            throw new Error('Failed to reload payments')
          }

          const payments = await responseData.json()

          setData((d) => ({
            ...d,
            payments,
          }))
        } catch (error) {
          console.error('Failed to add payment:', error)
          throw error
        }
      },
    }),
    [data, auth]
  )

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useSchool() {
  const ctx = useContext(DataContext)

  if (!ctx) {
    throw new Error('useSchool must be used within DataProvider')
  }

  return ctx
          }
