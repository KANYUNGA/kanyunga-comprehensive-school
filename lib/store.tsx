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
  type AttendanceStatus,
  type Exam,
  type Payment,
  type SchoolData,
  type SchoolInfo,
  type Student,
  type Subject,
  type Teacher,
} from './data'

export type Role = 'admin' | 'teacher' | 'parent'

export type CurrentUser = {
  id?: number | string
  username?: string
  name: string
  email?: string
  role: Role
  studentId?: string
}

type StudentWithPhoto = Student & {
  photoUrl?: string
}

type LoginData = {
  id?: number | string
  username?: string
  name: string
  email?: string
  role: Role
  studentId?: string
}

type SchoolContextValue = {
  data: SchoolData

  role: Role

  currentUser: CurrentUser | null

  login: (user: LoginData) => void
  logout: () => void

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

const SchoolContext =
  createContext<SchoolContextValue | null>(null)

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

    gender:
      student.gender ??
      'Male',

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

    stream:
      student.stream ??
      'Main',

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

    address:
      student.address ??
      '',

    admissionDate:
      student.admissionDate ??
      student.admission_date ??
      '',

    status:
      student.status ??
      'Active',

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

    gender:
      teacher.gender ??
      'Male',

    phone:
      teacher.phone ??
      '',

    email:
      teacher.email ??
      '',

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

    status:
      teacher.status ??
      'Active',
  }
}

function connectStudentsToClasses(
  students: StudentWithPhoto[],
  classes: any[]
): StudentWithPhoto[] {
  return students.map((student) => {
    const className = String(
      student.className ||
      student.classId ||
      ''
    ).trim()

    if (!className) {
      return student
    }

    const matchingClass = classes.find((cls: any) => {
      const name = String(
        cls.name ??
        cls.className ??
        cls.class_name ??
        ''
      ).trim()

      return (
        name.toLowerCase() ===
        className.toLowerCase()
      )
    })

    if (!matchingClass) {
      return {
        ...student,
        classId: className,
        className: className,
      }
    }

    const matchedName = String(
      matchingClass.name ??
      matchingClass.className ??
      matchingClass.class_name ??
      className
    ).trim()

    return {
      ...student,
      classId: matchedName,
      className: matchedName,
    }
  })
}

/*
 * Safely extracts an array from different API response formats.
 *
 * Supported:
 *   [...]
 *   { data: [...] }
 *   { students: [...] }
 *   { teachers: [...] }
 *   { classes: [...] }
 *   etc.
 */
function getApiArray(
  json: any,
  property?: string
): any[] {
  if (Array.isArray(json)) {
    return json
  }

  if (Array.isArray(json?.data)) {
    return json.data
  }

  if (
    property &&
    Array.isArray(json?.[property])
  ) {
    return json[property]
  }

  return []
}

export function SchoolProvider({
  children,
}: {
  children: ReactNode
}) {
  /*
   * IMPORTANT:
   * No demo/sample data is generated here.
   *
   * All school records must come from the database APIs.
   */
  const [data, setData] =
    useState<SchoolData>({
      school: {
        name:
          'Kanyunga Comprehensive School',
        motto: '',
        address: '',
        phone: '',
        email: '',
        logo: '',
        currentTerm: '',
        year:
          new Date().getFullYear(),
      },

      students: [],
      teachers: [],
      classes: [],
      subjects: [],
      exams: [],
      marks: [],
      attendance: [],
      payments: [],
      fees: [],
    })

  const [role, setRole] =
    useState<Role>('admin')

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null)

  const [loggedIn, setLoggedIn] =
    useState(false)

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
        attendanceRes,
      ] = await Promise.all([
        fetch('/api/students', {
          cache: 'no-store',
        }),

        fetch('/api/payments', {
          cache: 'no-store',
        }),

        fetch('/api/fees', {
          cache: 'no-store',
        }),

        fetch('/api/teachers', {
          cache: 'no-store',
        }),

        fetch('/api/classes', {
          cache: 'no-store',
        }),

        fetch('/api/subjects', {
          cache: 'no-store',
        }),

        fetch('/api/exams', {
          cache: 'no-store',
        }),

        fetch('/api/marks', {
          cache: 'no-store',
        }),

        fetch('/api/attendance', {
          cache: 'no-store',
        }),
      ])

      const studentsJson =
        studentsRes.ok
          ? await studentsRes.json()
          : []

      const paymentsJson =
        paymentsRes.ok
          ? await paymentsRes.json()
          : []

      const feesJson =
        feesRes.ok
          ? await feesRes.json()
          : []

      const teachersJson =
        teachersRes.ok
          ? await teachersRes.json()
          : []

      const classesJson =
        classesRes.ok
          ? await classesRes.json()
          : []

      const subjectsJson =
        subjectsRes.ok
          ? await subjectsRes.json()
          : []

      const examsJson =
        examsRes.ok
          ? await examsRes.json()
          : []

      const marksJson =
        marksRes.ok
          ? await marksRes.json()
          : []

      const attendanceJson =
        attendanceRes.ok
          ? await attendanceRes.json()
          : []

      const studentsArray =
        getApiArray(
          studentsJson,
          'students'
        )

      const teachersArray =
        getApiArray(
          teachersJson,
          'teachers'
        )

      const classesArray =
        getApiArray(
          classesJson,
          'classes'
        )

      const subjectsArray =
        getApiArray(
          subjectsJson,
          'subjects'
        )

      const examsArray =
        getApiArray(
          examsJson,
          'exams'
        )

      const marksArray =
        getApiArray(
          marksJson,
          'marks'
        )

      const paymentsArray =
        getApiArray(
          paymentsJson,
          'payments'
        )

      const feesArray =
        getApiArray(
          feesJson,
          'fees'
        )

      const attendanceArray =
        getApiArray(
          attendanceJson,
          'attendance'
        )

      const actualClasses =
        classesArray.map(
          (cls: any) => ({
            ...cls,

            id: String(cls.id),

            name:
              cls.name ??
              cls.className ??
              cls.class_name ??
              '',

            streams:
              Array.isArray(
                cls.streams
              )
                ? cls.streams
                : cls.stream
                  ? String(
                      cls.stream
                    )
                      .split(',')
                      .map(
                        (
                          s: string
                        ) =>
                          s.trim()
                      )
                      .filter(Boolean)
                  : [],

            classTeacherId:
              cls.classTeacherId ??
              (cls.class_teacher !=
              null
                ? String(
                    cls.class_teacher
                  )
                : null),
          })
        )

      const mappedStudents =
        studentsArray.map(
          mapStudent
        )

      const actualStudents =
        actualClasses.length > 0
          ? connectStudentsToClasses(
              mappedStudents,
              actualClasses
            )
          : mappedStudents

      const actualTeachers =
        teachersArray.map(
          mapTeacher
        )

      /*
       * Replace the current frontend
       * data with the actual database data.
       */
      setData((current) => ({
        ...current,

        students:
          actualStudents,

        teachers:
          actualTeachers,

        classes:
          actualClasses,

        subjects:
          subjectsArray,

        exams:
          examsArray,

        marks:
          marksArray,

        attendance:
          attendanceArray,

        payments:
          paymentsArray,

        fees:
          feesArray,
      }))

      console.log(
        'Database data loaded:',
        {
          students:
            actualStudents.length,

          teachers:
            actualTeachers.length,

          classes:
            actualClasses.length,

          subjects:
            subjectsArray.length,

          exams:
            examsArray.length,

          marks:
            marksArray.length,

          attendance:
            attendanceArray.length,

          payments:
            paymentsArray.length,

          fees:
            feesArray.length,
        }
      )
    } catch (error) {
      console.error(
        'Failed to load school data:',
        error
      )
    }
  }

  useEffect(() => {
    loadData()

    try {
      const savedUser =
        localStorage.getItem(
          'kanyunga-user'
        )

      if (!savedUser) {
        return
      }

      const user =
        JSON.parse(savedUser)

      if (user?.role) {
        const normalizedRole =
          String(
            user.role
          ).toLowerCase() as Role

        setRole(
          normalizedRole
        )

        setCurrentUser({
          id: user.id,

          username:
            user.username,

          name:
            user.name ??
            user.full_name ??
            '',

          email:
            user.email,

          role:
            normalizedRole,

          studentId:
            user.studentId,
        })

        setLoggedIn(true)
      }
    } catch (error) {
      console.error(
        'Failed to restore login session:',
        error
      )
    }
  }, [])

  const login = (
    user: LoginData
  ) => {
    const normalizedRole =
      String(
        user.role
      ).toLowerCase() as Role

    const loggedInUser:
      CurrentUser = {
        id:
          user.id,

        username:
          user.username,

        name:
          user.name,

        email:
          user.email,

        role:
          normalizedRole,

        studentId:
          user.studentId,
      }

    setRole(
      normalizedRole
    )

    setCurrentUser(
      loggedInUser
    )

    setLoggedIn(true)

    try {
      localStorage.setItem(
        'kanyunga-user',
        JSON.stringify(
          loggedInUser
        )
      )
    } catch (error) {
      console.error(
        'Failed to save login session:',
        error
      )
    }
  }

  const logout = () => {
    setLoggedIn(false)

    setRole('admin')

    setCurrentUser(null)

    try {
      localStorage.removeItem(
        'kanyunga-user'
      )
    } catch (error) {
      console.error(
        'Failed to clear login session:',
        error
      )
    }
  }

  const addStudent = async (
    student: Student
  ) => {
    const response =
      await fetch(
        '/api/students',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              student
            ),
        }
      )

    if (!response.ok) {
      throw new Error(
        'Failed to create student'
      )
    }

    await loadData()
  }

  const updateStudent =
    async (
      student: Student
    ) => {
      const response =
        await fetch(
          `/api/students/${encodeURIComponent(
            student.id
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                student
              ),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update student'
        )
      }

      await loadData()
    }

  const deleteStudent =
    async (
      id: string
    ) => {
      const response =
        await fetch(
          `/api/students/${encodeURIComponent(
            id
          )}`,
          {
            method: 'DELETE',
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete student'
        )
      }

      await loadData()
    }

  const addTeacher = async (
    teacher: Teacher
  ) => {
    const response =
      await fetch(
        '/api/teachers',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              teacher
            ),
        }
      )

    if (!response.ok) {
      const error =
        await response
          .json()
          .catch(
            () => null
          )

      throw new Error(
        error?.error ||
          error?.detail ||
          'Failed to create teacher'
      )
    }

    await loadData()
  }

  const updateTeacher =
    async (
      teacher: Teacher
    ) => {
      const response =
        await fetch(
          `/api/teachers/${encodeURIComponent(
            teacher.id
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                teacher
              ),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update teacher'
        )
      }

      await loadData()
    }

  const deleteTeacher =
    async (
      id: string
    ) => {
      const response =
        await fetch(
          `/api/teachers/${encodeURIComponent(
            id
          )}`,
          {
            method: 'DELETE',
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete teacher'
        )
      }

      await loadData()
    }

  const addClass = async (
    item: any
  ) => {
    const response =
      await fetch(
        '/api/classes',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              item
            ),
        }
      )

    if (!response.ok) {
      throw new Error(
        'Failed to create class'
      )
    }

    await loadData()
  }

  const updateClass =
    async (
      item: any
    ) => {
      const response =
        await fetch(
          `/api/classes/${encodeURIComponent(
            item.id
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                item
              ),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update class'
        )
      }

      await loadData()
    }

  const deleteClass =
    async (
      id: string
    ) => {
      const response =
        await fetch(
          `/api/classes/${encodeURIComponent(
            id
          )}`,
          {
            method: 'DELETE',
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete class'
        )
      }

      await loadData()
    }

  const addSubject =
    async (
      item: Subject
    ) => {
      const response =
        await fetch(
          '/api/subjects',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                item
              ),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to create subject'
        )
      }

      await loadData()
    }

  const updateSubject =
    async (
      item: Subject
    ) => {
      const response =
        await fetch(
          `/api/subjects/${encodeURIComponent(
            item.id
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                item
              ),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update subject'
        )
      }

      await loadData()
    }

  const deleteSubject =
    async (
      id: string
    ) => {
      const response =
        await fetch(
          `/api/subjects/${encodeURIComponent(
            id
          )}`,
          {
            method: 'DELETE',
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete subject'
        )
      }

      await loadData()
    }

  const addExam = async (
    item: Exam
  ) => {
    const response =
      await fetch(
        '/api/exams',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              item
            ),
        }
      )

    if (!response.ok) {
      throw new Error(
        'Failed to create exam'
      )
    }

    await loadData()
  }

  const updateExam =
    async (
      item: Exam
    ) => {
      const response =
        await fetch(
          `/api/exams/${encodeURIComponent(
            item.id
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                item
              ),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update exam'
        )
      }

      await loadData()
    }

  const deleteExam =
    async (
      id: string
    ) => {
      const response =
        await fetch(
          `/api/exams/${encodeURIComponent(
            id
          )}`,
          {
            method: 'DELETE',
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete exam'
        )
      }

      await loadData()
    }

  const addPayment =
    async (
      item: Payment
    ) => {
      const response =
        await fetch(
          '/api/payments',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                item
              ),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to create payment'
        )
      }

      await loadData()
    }

  const updateSchoolInfo =
    (
      info: SchoolInfo
    ) => {
      setData(
        (current) => ({
          ...current,

          school:
            info,
        })
      )
    }

  const saveAttendance =
    async (
      studentId: string,
      date: string,
      status: AttendanceStatus
    ) => {
      const response =
        await fetch(
          '/api/attendance',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                studentId,
                date,
                status,
              }),
          }
        )

      if (!response.ok) {
        throw new Error(
          'Failed to save attendance'
        )
      }

      await loadData()
    }

  const value =
    useMemo<SchoolContextValue>(
      () => ({
        data,

        role,

        currentUser,

        login,

        logout,

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
      [
        data,
        role,
        currentUser,
        loggedIn,
      ]
    )

  return (
    <SchoolContext.Provider
      value={value}
    >
      {children}
    </SchoolContext.Provider>
  )
}

export function useSchool() {
  const context =
    useContext(
      SchoolContext
    )

  if (!context) {
    throw new Error(
      'useSchool must be used inside SchoolProvider'
    )
  }

  return context
}
