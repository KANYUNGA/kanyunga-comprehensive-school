
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

  return String(value).slice(0, 10)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const { id } = await params
    const student = await request.json()

    const studentId = Number(id)

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return Response.json(
        {
          success: false,
          error: "Invalid student ID",
        },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE students
      SET
        admission_number = ${safeString(student.admissionNo)},
        first_name = ${safeString(student.firstName)},
        middle_name = ${safeString(student.middleName) || null},
        last_name = ${safeString(student.lastName)},
        gender = ${safeString(student.gender)},
        date_of_birth = ${
          safeString(student.dateOfBirth) || null
        },
        class_name = ${
          safeString(
            student.className ?? student.classId
          )
        },
        stream = ${safeString(student.stream)},
        parent_name = ${safeString(student.guardianName)},
        parent_phone = ${safeString(student.guardianPhone)},
        address = ${safeString(student.address) || null},
        admission_date = ${
          safeString(student.admissionDate) || null
        },
        status = ${
          safeString(student.status) || "Active"
        }
      WHERE id = ${studentId}
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
        status
    `

    if (result.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Student not found",
        },
        { status: 404 }
      )
    }

    const s = result[0]

    return Response.json({
      success: true,
      student: {
        id: String(s.id),
        admissionNo: safeString(
          s.admission_number
        ),
        firstName: safeString(s.first_name),
        middleName: safeString(s.middle_name),
        lastName: safeString(s.last_name),
        gender: safeString(s.gender) || "Male",
        classId: safeString(s.class_name),
        className: safeString(s.class_name),
        stream: safeString(s.stream),
        dateOfBirth: formatDate(s.date_of_birth),
        guardianName: safeString(s.parent_name),
        guardianPhone: safeString(s.parent_phone),
        address: safeString(s.address),
        email: "",
        admissionDate: formatDate(
          s.admission_date
        ),
        status:
          safeString(s.status) || "Active",
        photoUrl: "",
      },
    })
  } catch (error) {
    console.error(
      "FAILED TO UPDATE STUDENT:",
      error
    )

    return Response.json(
      {
        success: false,
        error: "Failed to update student",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const { id } = await params
    const studentId = Number(id)

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return Response.json(
        {
          success: false,
          error: "Invalid student ID",
        },
        { status: 400 }
      )
    }

    const result = await sql`
      DELETE FROM students
      WHERE id = ${studentId}
      RETURNING id
    `

    if (result.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Student not found",
        },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
    })
  } catch (error) {
    console.error(
      "FAILED TO DELETE STUDENT:",
      error
    )

    return Response.json(
      {
        success: false,
        error: "Failed to delete student",
      },
      { status: 500 }
    )
  }
}
