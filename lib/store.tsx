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

/*
 * Student data used by the database/API.
 *
 * Your original Student type in lib/data.ts does not contain
 * these database-specific fields, so we extend it here.
 */
export type StudentWithPhoto = Student & {
  middleName?: string
  address?: string
  className?: string
  createdAt?: string
  photoUrl?: string
  hasPhoto?: boolean
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
    status: AttendanceStatus,
  ) => Promise<void>
}

const SchoolContext =
  createContext<SchoolContextValue | null>(null)

/*
 * -------------------------------------------------------
 * STUDENT MAPPER
 * -------------------------------------------------------
 */
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

    lastName:
      student.lastName ??
      student.last_name ??
      '',

    gender:
      student.gender ??
      'Male',

    classId:
      student.classId ??
      student.className ??
      student.class_name ??
      '',

    stream:
      student.stream ??
      'Main',

    dateOfBirth:
      student.dateOfBirth ??
      student.date_of_birth ??
      '',

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

    email:
      student.email ??
      '',

    admissionDate:
      student.admissionDate ??
      student.admission_date ??
      '',

    status:
      student.status ??
      'Active',

    /*
     * Extended database fields.
     */
    middleName:
      student.middleName ??
      student.middle_name ??
      '',

    address:
      student.address ??
      '',

    className:
      student.className ??
      student.class_name ??
      '',

    createdAt:
      student.createdAt ??
      student.created_at ??
      '',

    /*
     * The normal student list should only return a photo
     * when specifically supplied. Usually this remains empty.
     */
    photoUrl:
      student.photoUrl ??
      student.photo_url ??
      '',

    hasPhoto:
      Boolean(
        student.hasPhoto ??
        student.has_photo
      ),
  }
}

/*
 * -------------------------------------------------------
 * TEACHER MAPPER
 * -------------------------------------------------------
 */
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
      Array.isArray(teacher.subjectIds)
        ? teacher.subjectIds
        : teacher.subject
          ? String(teacher.subject)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],

    employmentDate:
      teacher.employmentDate ??
      teacher.employment_date ??
      '',

    status:
      teacher.status ??
      'Active',
  }
}

/*
 * -------------------------------------------------------
 * CONNECT STUDENTS TO CLASSES
 * -------------------------------------------------------
 */
function connectStudentsToClasses(
  students: StudentWithPhoto[],
  classes: any[],
): StudentWithPhoto[] {
  const normalizeClassName = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')

  return students.map((student) => {
    const className = String(
      student.className ||
        student.classId ||
        '',
    ).trim()

    if (!className) {
      return student
    }

    const matchingClass =
      classes.find((cls: any) => {
        const name = String(
          cls.name ??
            cls.className ??
            cls.class_name ??
            '',
        ).trim()

        return (
          normalizeClassName(name) ===
          normalizeClassName(className)
        )
      })

    if (!matchingClass) {
      return {
        ...student,
        classId: className,
        className,
      }
    }

    const matchedName = String(
      matchingClass.name ??
        matchingClass.className ??
        matchingClass.class_name ??
        className,
    ).trim()

    return {
      ...student,
      classId: matchedName,
      className: matchedName,
    }
  })
}

/*
 * -------------------------------------------------------
 * SAFE API ARRAY READER
 * -------------------------------------------------------
 */
function getApiArray(
  json: any,
  property?: string,
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

/*
 * -------------------------------------------------------
 * SCHOOL PROVIDER
 * -------------------------------------------------------
 */
export function SchoolProvider({
  children,
}: {
  children: ReactNode
}) {
  /*
   * IMPORTANT:
   *
   * This structure MUST match SchoolData in lib/data.ts.
   */
  const [data, setData] =
    useState<SchoolData>({
      school: {
        name:
          'Kanyunga Comprehensive School',

        motto:
          'Education for Excellence',

        poBox:
          '',

        phone:
          '',

        email:
          '',

        currentTerm:
          '',

        currentYear:
          new Date().getFullYear(),
      },

      classes: [],

      subjects: [],

      students: [],

      teachers: [],

      studentAttendance: [],

      teacherAttendance: [],

      exams: [],

      marks: [],

      feeStructures: [],

      payments: [],
    })

  const [role, setRole] =
    useState<Role>('admin')

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null)

  /*
   * -----------------------------------------------------
   * GENERIC API FETCHER
   * -----------------------------------------------------
   */
  const fetchApi = async (
    url: string,
    property?: string,
  ): Promise<any[] | null> => {
    try {
      const response =
        await fetch(url, {
          cache: 'no-store',
        })

      if (!response.ok) {
        console.error(
          `${url} returned HTTP ${response.status}`,
        )

        return null
      }

      const json =
        await response.json()

      return getApiArray(
        json,
        property,
      )
    } catch (error) {
      console.error(
        `Failed to load ${url}:`,
        error,
      )

      return null
    }
  }

  /*
   * -----------------------------------------------------
   * LOAD STUDENTS ONLY
   * -----------------------------------------------------
   *
   * Student add/edit/delete uses this instead of
   * reloading the entire school database.
   */
  const loadStudentsOnly =
    async (): Promise<void> => {
      try {
        const studentsArray =
          await fetchApi(
            '/api/students',
            'students',
          )

        if (
          studentsArray === null
        ) {
          console.error(
            'Students API failed. Existing students were preserved.',
          )

          return
        }

        const mappedStudents =
          studentsArray.map(
            mapStudent,
          )

        setData((current) => ({
          ...current,

          students:
            connectStudentsToClasses(
              mappedStudents,
              current.classes,
            ),
        }))

        console.log(
          'STUDENTS REFRESHED:',
          mappedStudents.length,
        )
      } catch (error) {
        console.error(
          'Failed to refresh students:',
          error,
        )
      }
    }

  /*
   * -----------------------------------------------------
   * LOAD ALL SCHOOL DATA
   * -----------------------------------------------------
   */
  const loadData =
    async (): Promise<void> => {
      try {
        const [
          studentsArray,
          paymentsArray,
          feesArray,
          teachersArray,
          classesArray,
          subjectsArray,
          examsArray,
          marksArray,
          attendanceArray,
        ] = await Promise.all([
          fetchApi(
            '/api/students',
            'students',
          ),

          fetchApi(
            '/api/payments',
            'payments',
          ),

          fetchApi(
            '/api/fees',
            'fees',
          ),

          fetchApi(
            '/api/teachers',
            'teachers',
          ),

          fetchApi(
            '/api/classes',
            'classes',
          ),

          fetchApi(
            '/api/subjects',
            'subjects',
          ),

          fetchApi(
            '/api/exams',
            'exams',
          ),

          fetchApi(
            '/api/marks',
            'marks',
          ),

          fetchApi(
            '/api/attendance',
            'attendance',
          ),
        ])

        /*
         * -------------------------------------------------
         * CLASSES
         * -------------------------------------------------
         */
        const actualClasses =
          classesArray !== null
            ? classesArray.map(
                (cls: any) => ({
                  ...cls,

                  id: String(
                    cls.id,
                  ),

                  name:
                    cls.name ??
                    cls.className ??
                    cls.class_name ??
                    '',

                  streams:
                    Array.isArray(
                      cls.streams,
                    )
                      ? cls.streams
                      : cls.stream
                        ? String(
                            cls.stream,
                          )
                            .split(',')
                            .map(
                              (
                                s: string,
                              ) =>
                                s.trim(),
                            )
                            .filter(
                              Boolean,
                            )
                        : [],

                  classTeacherId:
                    cls.classTeacherId ??
                    (
                      cls.class_teacher !=
                      null
                        ? String(
                            cls.class_teacher,
                          )
                        : null
                    ),
                }),
              )
            : null

        /*
         * -------------------------------------------------
         * STUDENTS
         * -------------------------------------------------
         */
        let mappedStudents:
          StudentWithPhoto[] | null =
          null

        if (
          studentsArray !== null
        ) {
          try {
            mappedStudents =
              studentsArray.map(
                mapStudent,
              )

            console.log(
              'STUDENTS API LOADED:',
              mappedStudents.length,
            )
          } catch (error) {
            console.error(
              'Failed to map students:',
              error,
            )
          }
        }

        /*
         * -------------------------------------------------
         * TEACHERS
         * -------------------------------------------------
         */
        let mappedTeachers:
          Teacher[] | null =
          null

        if (
          teachersArray !== null
        ) {
          try {
            mappedTeachers =
              teachersArray.map(
                mapTeacher,
              )
          } catch (error) {
            console.error(
              'Failed to map teachers:',
              error,
            )
          }
        }

        /*
         * -------------------------------------------------
         * UPDATE STATE
         * -------------------------------------------------
         */
        setData((current) => {
          const classesToUse =
            actualClasses ??
            current.classes

          let actualStudents =
            current.students

          if (
            mappedStudents !== null
          ) {
            actualStudents =
              connectStudentsToClasses(
                mappedStudents,
                classesToUse,
              )
          }

          /*
           * Attendance API normally returns student
           * attendance records. We keep them in the
           * correct SchoolData property.
           */
          const studentAttendance =
            attendanceArray !== null
              ? attendanceArray.filter(
                  (item: any) =>
                    item.studentId != null ||
                    item.student_id != null,
                )
              : current.studentAttendance

          return {
            ...current,

            students:
              actualStudents,

            teachers:
              mappedTeachers ??
              current.teachers,

            classes:
              actualClasses ??
              current.classes,

            subjects:
              subjectsArray ??
              current.subjects,

            exams:
              examsArray ??
              current.exams,

            marks:
              marksArray ??
              current.marks,

            studentAttendance,

            /*
             * Preserve teacher attendance unless your
             * attendance API specifically supplies it.
             */
            teacherAttendance:
              current.teacherAttendance,

            payments:
              paymentsArray ??
              current.payments,

            feeStructures:
              feesArray ??
              current.feeStructures,
          }
        })

        console.log(
          'DATABASE DATA LOADED:',
          {
            students:
              studentsArray?.length ??
              'FAILED',

            teachers:
              teachersArray?.length ??
              'FAILED',

            classes:
              classesArray?.length ??
              'FAILED',

            subjects:
              subjectsArray?.length ??
              'FAILED',

            exams:
              examsArray?.length ??
              'FAILED',

            marks:
              marksArray?.length ??
              'FAILED',

            attendance:
              attendanceArray?.length ??
              'FAILED',

            payments:
              paymentsArray?.length ??
              'FAILED',

            fees:
              feesArray?.length ??
              'FAILED',
          },
        )
      } catch (error) {
        console.error(
          'Failed to load school data:',
          error,
        )
      }
    }

  /*
   * -----------------------------------------------------
   * INITIAL LOAD + LOGIN RESTORATION
   * -----------------------------------------------------
   */
  useEffect(() => {
    console.log(
      '🏫 SCHOOL PROVIDER MOUNTED',
    )

    void loadData()

    try {
      const savedUser =
        localStorage.getItem(
          'kanyunga-user',
        )

      if (!savedUser) {
        return
      }

      const user =
        JSON.parse(savedUser)

      if (user?.role) {
        const normalizedRole =
          String(
            user.role,
          ).toLowerCase() as Role

        setRole(
          normalizedRole,
        )

        setCurrentUser({
          id:
            user.id,

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
      }
    } catch (error) {
      console.error(
        'Failed to restore login session:',
        error,
      )
    }

    return () => {
      console.log(
        '🏫 SCHOOL PROVIDER UNMOUNTED',
      )
    }
  }, [])

  /*
   * -----------------------------------------------------
   * LOGIN
   * -----------------------------------------------------
   */
  const login = (
    user: LoginData,
  ) => {
    const normalizedRole =
      String(
        user.role,
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
      normalizedRole,
    )

    setCurrentUser(
      loggedInUser,
    )

    try {
      localStorage.setItem(
        'kanyunga-user',
        JSON.stringify(
          loggedInUser,
        ),
      )
    } catch (error) {
      console.error(
        'Failed to save login session:',
        error,
      )
    }
  }

  /*
   * -----------------------------------------------------
   * LOGOUT
   * -----------------------------------------------------
   */
  const logout = () => {
    setRole('admin')

    setCurrentUser(null)

    try {
      localStorage.removeItem(
        'kanyunga-user',
      )
    } catch (error) {
      console.error(
        'Failed to clear login session:',
        error,
      )
    }
  }

  /*
   * -----------------------------------------------------
   * STUDENT CRUD
   * -----------------------------------------------------
   */
  const addStudent = async (
    student: Student,
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
              student,
            ),
        },
      )

    if (!response.ok) {
      const error =
        await response
          .json()
          .catch(
            () => null,
          )

      throw new Error(
        error?.error ||
          'Failed to create student',
      )
    }

    await loadStudentsOnly()
  }

  const updateStudent =
    async (
      student: Student,
    ) => {
      const response =
        await fetch(
          `/api/students/${encodeURIComponent(
            student.id,
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                student,
              ),
          },
        )

      if (!response.ok) {
        const error =
          await response
            .json()
            .catch(
              () => null,
            )

        throw new Error(
          error?.error ||
            'Failed to update student',
        )
      }

      await loadStudentsOnly()
    }

  const deleteStudent =
    async (
      id: string,
    ) => {
      const response =
        await fetch(
          `/api/students/${encodeURIComponent(
            id,
          )}`,
          {
            method: 'DELETE',
          },
        )

      if (!response.ok) {
        const error =
          await response
            .json()
            .catch(
              () => null,
            )

        throw new Error(
          error?.error ||
            'Failed to delete student',
        )
      }

      await loadStudentsOnly()
    }

  /*
   * -----------------------------------------------------
   * TEACHER CRUD
   * -----------------------------------------------------
   */
  const addTeacher = async (
    teacher: Teacher,
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
              teacher,
            ),
        },
      )

    if (!response.ok) {
      const error =
        await response
          .json()
          .catch(
            () => null,
          )

      throw new Error(
        error?.error ||
          error?.detail ||
          'Failed to create teacher',
      )
    }

    await loadData()
  }

  const updateTeacher =
    async (
      teacher: Teacher,
    ) => {
      const response =
        await fetch(
          `/api/teachers/${encodeURIComponent(
            teacher.id,
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                teacher,
              ),
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update teacher',
        )
      }

      await loadData()
    }

  const deleteTeacher =
    async (
      id: string,
    ) => {
      const response =
        await fetch(
          `/api/teachers/${encodeURIComponent(
            id,
          )}`,
          {
            method: 'DELETE',
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete teacher',
        )
      }

      await loadData()
    }

  /*
   * -----------------------------------------------------
   * CLASS CRUD
   * -----------------------------------------------------
   */
  const addClass = async (
    item: any,
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
              item,
            ),
        },
      )

    if (!response.ok) {
      throw new Error(
        'Failed to create class',
      )
    }

    await loadData()
  }

  const updateClass =
    async (
      item: any,
    ) => {
      const response =
        await fetch(
          `/api/classes/${encodeURIComponent(
            item.id,
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                item,
              ),
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update class',
        )
      }

      await loadData()
    }

  const deleteClass =
    async (
      id: string,
    ) => {
      const response =
        await fetch(
          `/api/classes/${encodeURIComponent(
            id,
          )}`,
          {
            method: 'DELETE',
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete class',
        )
      }

      await loadData()
    }

  /*
   * -----------------------------------------------------
   * SUBJECT CRUD
   * -----------------------------------------------------
   */
  const addSubject =
    async (
      item: Subject,
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
                item,
              ),
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to create subject',
        )
      }

      await loadData()
    }

  const updateSubject =
    async (
      item: Subject,
    ) => {
      const response =
        await fetch(
          `/api/subjects/${encodeURIComponent(
            item.id,
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                item,
              ),
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update subject',
        )
      }

      await loadData()
    }

  const deleteSubject =
    async (
      id: string,
    ) => {
      const response =
        await fetch(
          `/api/subjects/${encodeURIComponent(
            id,
          )}`,
          {
            method: 'DELETE',
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete subject',
        )
      }

      await loadData()
    }

  /*
   * -----------------------------------------------------
   * EXAM CRUD
   * -----------------------------------------------------
   */
  const addExam = async (
    item: Exam,
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
              item,
            ),
        },
      )

    if (!response.ok) {
      throw new Error(
        'Failed to create exam',
      )
    }

    await loadData()
  }

  const updateExam =
    async (
      item: Exam,
    ) => {
      const response =
        await fetch(
          `/api/exams/${encodeURIComponent(
            item.id,
          )}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                item,
              ),
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to update exam',
        )
      }

      await loadData()
    }

  const deleteExam =
    async (
      id: string,
    ) => {
      const response =
        await fetch(
          `/api/exams/${encodeURIComponent(
            id,
          )}`,
          {
            method: 'DELETE',
          },
        )

      if (!response.ok) {
        throw new Error(
          'Failed to delete exam',
        )
      }

      await loadData()
    }

  /*
   * -----------------------------------------------------
   * PAYMENT
   * -----------------------------------------------------
   */
  const addPayment =
    async (
      item: Payment,
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
                item,
              ),
          },
        )

      if (!response.ok) {
        const error =
          await response
            .json()
            .catch(
              () => null,
            )

        throw new Error(
          error?.error ||
            'Failed to create payment',
        )
      }

      await loadData()
    }

  /*
   * -----------------------------------------------------
   * SCHOOL INFORMATION
   * -----------------------------------------------------
   */
  const updateSchoolInfo =
    (
      info: SchoolInfo,
    ) => {
      setData(
        (current) => ({
          ...current,

          school:
            info,
        }),
      )
    }

  /*
   * -----------------------------------------------------
   * ATTENDANCE
   * -----------------------------------------------------
   */
  const saveAttendance =
    async (
      studentId: string,
      date: string,
      status: AttendanceStatus,
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
          },
        )

      if (!response.ok) {
        const error =
          await response
            .json()
            .catch(
              () => null,
            )

        throw new Error(
          error?.error ||
            'Failed to save attendance',
        )
      }

      await loadData()
    }

  /*
   * -----------------------------------------------------
   * CONTEXT VALUE
   * -----------------------------------------------------
   */
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
      ],
    )

  return (
    <SchoolContext.Provider
      value={value}
    >
      {children}
    </SchoolContext.Provider>
  )
}

/*
 * -------------------------------------------------------
 * USE SCHOOL
 * -------------------------------------------------------
 */
export function useSchool() {
  const context =
    useContext(
      SchoolContext,
    )

  if (!context) {
    throw new Error(
      'useSchool must be used inside SchoolProvider',
    )
  }

  return context
}
