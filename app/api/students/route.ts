import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

function safeString(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
}

function formatDate(value: unknown): string {
  if (!value) return ""

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  const text = String(value)

  if (text.length >= 10) {
    return text.slice(0, 10)
  }

  return text
}

function mapStudent(student: any) {
  return {
    id: String(student.id),
    admissionNo: safeString(student.admission_number),
    firstName: safeString(student.first_name),
    middleName: safeString(student.middle_name),
    lastName: safeString(student.last_name),
    gender: safeString(student.gender),
    classId: safeString(student.class_name),
    className: safeString(student.class_name),
    stream: safeString(student.stream),
    dateOfBirth: formatDate(student.date_of_birth),
    guardianName: safeString(student.parent_name),
    guardianPhone: safeString(student.parent_phone),
    address: safeString(student.address),
    email: safeString(student.email),
    admissionDate: formatDate(student.admission_date),
    status: safeString(student.status) || "Active",
    photoUrl: safeString(student.photo_url),
  }
}

/* =========================================================
   GET ALL STUDENTS
   ========================================================= */

export async function GET() {
  try {
    const students = await sql`
      SELECT
        id,
        admission_number,
        first_name,
        middle_name,
        last_name,
        gender,
        date_of_birth,
        class_name,
        stream,
        parent_name,
        parent_phone,
        address,
        admission_date,
        status,
        photo_url,
        created_at
      FROM students
      ORDER BY
        first_name ASC,
        last_name ASC,
        id ASC
    `

    const mappedStudents = students.map((student: any) =>
      mapStudent(student)
    )

    return Response.json({
      success: true,
      count: mappedStudents.length,
      students: mappedStudents,
    })
  } catch (error) {
    console.error("FAILED TO LOAD STUDENTS:", error)

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
}

/* =========================================================
   CREATE STUDENT
   ========================================================= */

export async function POST(request: Request) {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const body = await request.json()

    const admissionNo = safeString(body.admissionNo).trim()
    const firstName = safeString(body.firstName).trim()
    const middleName = safeString(body.middleName).trim()
    const lastName = safeString(body.lastName).trim()
    const gender = safeString(body.gender).trim()

    const className = safeString(
      body.className ?? body.classId
    ).trim()

    const stream = safeString(body.stream).trim()
    const dateOfBirth = safeString(body.dateOfBirth).trim()

    const guardianName = safeString(
      body.guardianName
    ).trim()

    const guardianPhone = safeString(
      body.guardianPhone
    ).trim()

    const address = safeString(body.address).trim()
    const admissionDate = safeString(
      body.admissionDate
    ).trim()

    const status =
      safeString(body.status).trim() || "Active"

    const photoUrl = safeString(body.photoUrl).trim()

    if (!admissionNo) {
      return Response.json(
        {
          success: false,
          error: "Admission number is required",
        },
        { status: 400 }
      )
    }

    if (!firstName) {
      return Response.json(
        {
          success: false,
          error: "First name is required",
        },
        { status: 400 }
      )
    }

    if (!lastName) {
      return Response.json(
        {
          success: false,
          error: "Last name is required",
        },
        { status: 400 }
      )
    }

    const existing = await sql`
      SELECT id
      FROM students
      WHERE admission_number = ${admissionNo}
      LIMIT 1
    `

    if (existing.length > 0) {
      return Response.json(
        {
          success: false,
          error: `Admission number ${admissionNo} already exists`,
        },
        { status: 409 }
      )
    }

    const result = await sql`
      INSERT INTO students (
        admission_number,
        first_name,
        middle_name,
        last_name,
        gender,
        date_of_birth,
        class_name,
        stream,
        parent_name,
        parent_phone,
        address,
        admission_date,
        status,
        photo_url
      )
      VALUES (
        ${admissionNo},
        ${firstName},
        ${middleName},
        ${lastName},
        ${gender},
        ${dateOfBirth || null},
        ${className},
        ${stream},
        ${guardianName},
        ${guardianPhone},
        ${address},
        ${admissionDate || null},
        ${status},
        ${photoUrl || null}
      )
      RETURNING
        id,
        admission_number,
        first_name,
        middle_name,
        last_name,
        gender,
        date_of_birth,
        class_name,
        stream,
        parent_name,
        parent_phone,
        address,
        admission_date,
        status,
        photo_url,
        created_at
    `

    const student = result[0]

    return Response.json(
      {
        success: true,
        student: mapStudent(student),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("FAILED TO CREATE STUDENT:", error)

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
  }
