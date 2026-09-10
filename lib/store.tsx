
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

type StudentWithPhoto = Student & {
  photoUrl?: string
}

type SchoolContextValue = {
  data: SchoolData
  role: Role

  addStudent: (student: Student) => Promise<void>
  updateStudent: (student: Student) => Promise<void>
  deleteStudent: (id: string) => Promise<void>

  addTeacher: (teacher: Teacher) => Promise<void>
  updateTeacher: (teacher: Teacher) => Promise<void>
  deleteTeacher: (id: string) => Promise<void>

  addClass: (item: any) => Promise<void>
  updateClass: (item: any) => Promise<void>
  deleteClass: (id: string) => Promise<void>

  addSubject: (item: Subject) => Promise<void>
  updateSubject: (item: Subject) => Promise<void>
  deleteSubject: (id: string) => Promise<void>

  addExam: (item: Exam) => Promise<void>
  updateExam: (item: Exam) => Promise<void>
  deleteExam: (id: string) => Promise<void>

  addPayment: (item: Payment) => Promise<void>

  updateSchoolInfo: (info: SchoolInfo) => void

  saveAttendance: (
    studentId: string,
    date: string,
    status: AttendanceStatus
  ) => Promise<void>
}

const SchoolContext = createContext<SchoolContextValue | null>(null)

function mapStudent(student: any): StudentWithPhoto {
  return {
    id: String(student.id),
    admissionNo:
      student.admissionNo ??
      student.admission_number ??
      '',
    firstName:
      student.firstName ??
      student.first_name ??
      '',
    middleName:
      student.middleName ??
      student.middle_name ??
      '',
    lastName:
      student.lastName ??
      student.last_name ??
      '',
    gender: student.gender ?? 'Male',
    dateOfBirth:
      student.dateOfBirth ??
      student.date_of_birth ??
      '',
    classId:
      student.classId ??
      student.className ??
      student.class_name ??
      '',
    className:
      student.className ??
      student.class_name ??
      '',
    stream: student.stream ?? 'Main',
    guardianName:
      student.guardianName ??
      student.parentName ??
      student.parent_name ??
      '',
    guardianPhone:
      student.guardianPhone ??
      student.parentPhone ??
      student.parent_phone ??
      '',
    address: student.address ?? '',
    admissionDate:
      student.admissionDate ??
      student.admission_date ??
      '',
    status: student.status ?? 'Active',
    createdAt:
      student.createdAt ??
      student.created_at ??
      '',
    photoUrl:
      student.photoUrl ??
      student.photo_url ??
      '',
  }
}

function mapTeacher(teacher: any): Teacher {
  return {
    id: String(teacher.id),
    staffNo:
      teacher.staffNo ??
      teacher.teacher_number ??
      '',
    firstName:
      teacher.firstName ??
      teacher.first_name ??
      '',
    lastName:
      teacher.lastName ??
      teacher.last_name ??
      '',
    gender: teacher.gender ?? 'Male',
    phone: teacher.phone ?? '',
    email: teacher.email ?? '',
    subjectIds:
      teacher.subjectIds ??
      (teacher.subject
        ? String(teacher.subject)
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []),
    employmentDate:
      teacher.employmentDate ??
      teacher.employment_date ??
      '',
    status: teacher.status ?? 'Active',
  }
}

export function SchoolProvider({
  children,
}: {
  children: ReactNode
}) {
  const [data, setData] = useState<SchoolData>(() => createSampleData())
  const [role] = useState<Role>('admin')

  const loadData = async () => {
    try {
      const [
        studentsRes,
        paymentsRes,
        feesRes,
        teachersRes,
        classesRes,
        subjectsRes,
        examsRes,
        marksRes,
      ] = await Promise.all([
        fetch('/api/students', { cache: 'no-store' }),
        fetch('/api/payments', { cache: 'no-store' }),
        fetch('/api/fees', { cache: 'no-store' }),
        fetch('/api/teachers', { cache: 'no-store' }),
        fetch('/api/classes', { cache: 'no-store' }),
        fetch('/api/subjects', { cache: 'no-store' }),
        fetch('/api/exams', { cache: 'no-store' }),
        fetch('/api/marks', { cache: 'no-store' }),
      ])

      const studentsJson = studentsRes.ok
        ? await studentsRes.json()
        : []

      const paymentsJson = paymentsRes.ok
        ? await paymentsRes.json()
        : []

      const feesJson = feesRes.ok
        ? await feesRes.json()
        : []

      const teachersJson = teachersRes.ok
        ? await teachersRes.json()
        : []

      const classesJson = classesRes.ok
        ? await classesRes.json()
        : []

      const subjectsJson = subjectsRes.ok
        ? await subjectsRes.json()
        : []

      const examsJson = examsRes.ok
        ? await examsRes.json()
        : []

      const marksJson = marksRes.ok
        ? await marksRes.json()
        : []

      const studentsArray = Array.isArray(studentsJson)
        ? studentsJson
        : studentsJson.students ?? []

      const teachersArray = Array.isArray(teachersJson)
        ? teachersJson
        : teachersJson.teachers ?? []

      const classesArray = Array.isArray(classesJson)
        ? classesJson
        : classesJson.classes ?? []

      const subjectsArray = Array.isArray(subjectsJson)
        ? subjectsJson
        : subjectsJson.subjects ?? []

      const examsArray = Array.isArray(examsJson)
        ? examsJson
        : examsJson.exams ?? []

      const marksArray = Array.isArray(marksJson)
        ? marksJson
        : marksJson.marks ?? []

      const paymentsArray = Array.isArray(paymentsJson)
        ? paymentsJson
        : paymentsJson.payments ?? []

      const feesArray = Array.isArray(feesJson)
        ? feesJson
        : feesJson.fees ?? []

      setData((current) => ({
        ...current,

        students:
          studentsArray.length > 0
            ? studentsArray.map(mapStudent)
            : current.students,

        teachers:
          teachersArray.length > 0
            ? teachersArray.map(mapTeacher)
            : current.teachers,

        classes:
          classesArray.length > 0
            ? classesArray
            : current.classes,

        subjects:
          subjectsArray.length > 0
            ? subjectsArray
            : current.subjects,

        exams:
          examsArray.length > 0
            ? examsArray
            : current.exams,

        marks:
          marksArray.length > 0
            ? marksArray
            : current.marks,

        payments:
          paymentsArray.length > 0
            ? paymentsArray
            : current.payments,

        fees:
          feesArray.length > 0
            ? feesArray
            : current.fees,
      }))
    } catch (error) {
      console.error('Failed to load school data:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const addStudent = async (student: Student) => {
    const response = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(student),
    })

    if (!response.ok) {
      throw new Error('Failed to create student')
    }

    await loadData()
  }

  const updateStudent = async (student: Student) => {
    const response = await fetch(
      `/api/students/${encodeURIComponent(student.id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update student')
    }

    await loadData()
  }

  const deleteStudent = async (id: string) => {
    const response = await fetch(
      `/api/students/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete student')
    }

    await loadData()
  }

  const addTeacher = async (teacher: Teacher) => {
    const response = await fetch('/api/teachers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teacher),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)

      throw new Error(
        error?.error ||
          error?.detail ||
          'Failed to create teacher'
      )
    }

    await loadData()
  }

  const updateTeacher = async (teacher: Teacher) => {
    const response = await fetch(
      `/api/teachers/${encodeURIComponent(teacher.id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teacher),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update teacher')
    }

    await loadData()
  }

  const deleteTeacher = async (id: string) => {
    const response = await fetch(
      `/api/teachers/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete teacher')
    }

    await loadData()
  }

  const addClass = async (item: any) => {
    const response = await fetch('/api/classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      throw new Error('Failed to create class')
    }

    await loadData()
  }

  const updateClass = async (item: any) => {
    const response = await fetch(
      `/api/classes/${encodeURIComponent(item.id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update class')
    }

    await loadData()
  }

  const deleteClass = async (id: string) => {
    const response = await fetch(
      `/api/classes/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete class')
    }

    await loadData()
  }

  const addSubject = async (item: Subject) => {
    const response = await fetch('/api/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      throw new Error('Failed to create subject')
    }

    await loadData()
  }

  const updateSubject = async (item: Subject) => {
    const response = await fetch(
      `/api/subjects/${encodeURIComponent(item.id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update subject')
    }

    await loadData()
  }

  const deleteSubject = async (id: string) => {
    const response = await fetch(
      `/api/subjects/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete subject')
    }

    await loadData()
  }

  const addExam = async (item: Exam) => {
    const response = await fetch('/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      throw new Error('Failed to create exam')
    }

    await loadData()
  }

  const updateExam = async (item: Exam) => {
    const response = await fetch(
      `/api/exams/${encodeURIComponent(item.id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update exam')
    }

    await loadData()
  }

  const deleteExam = async (id: string) => {
    const response = await fetch(
      `/api/exams/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete exam')
    }

    await loadData()
  }

  const addPayment = async (item: Payment) => {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      throw new Error('Failed to create payment')
    }

    await loadData()
  }

  const updateSchoolInfo = (info: SchoolInfo) => {
    setData((current) => ({
      ...current,
      school: info,
    }))
  }

  const saveAttendance = async (
    studentId: string,
    date: string,
    status: AttendanceStatus
  ) => {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId,
        date,
        status,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save attendance')
    }

    await loadData()
  }

  const value = useMemo<SchoolContextValue>(
    () => ({
      data,
      role,
      addStudent,
      updateStudent,
      deleteStudent,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      addClass,
      updateClass,
      deleteClass,
      addSubject,
      updateSubject,
      deleteSubject,
      addExam,
      updateExam,
      deleteExam,
      addPayment,
      updateSchoolInfo,
      saveAttendance,
    }),
    [data, role]
  )

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  )
}

export function useSchool() {
  const context = useContext(SchoolContext)

  if (!context) {
    throw new Error(
      'useSchool must be used inside SchoolProvider'
    )
  }

  return context
}                           
