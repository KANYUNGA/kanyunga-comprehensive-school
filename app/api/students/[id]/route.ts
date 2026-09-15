
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

async function ensurePhotoColumn() {
  await sql`
    ALTER TABLE students
    ADD COLUMN IF NOT EXISTS photo_url TEXT
  `
}

/* =========================================================
   UPDATE STUDENT
   ========================================================= */

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    await ensurePhotoColumn()

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

    const admissionNo = safeString(
      student.admissionNo
    ).trim()

    const firstName = safeString(
      student.firstName
    ).trim()

    const middleName = safeString(
      student.middleName
    ).trim()

    const lastName = safeString(
      student.lastName
    ).trim()

    const gender = safeString(
      student.gender
    ).trim()

    const className = safeString(
      student.className ?? student.classId
    ).trim()

    const stream = safeString(
      student.stream
    ).trim()

    const dateOfBirth = safeString(
      student.dateOfBirth
    ).trim()

    const guardianName = safeString(
      student.guardianName
    ).trim()

    const guardianPhone = safeString(
      student.guardianPhone
    ).trim()

    const address = safeString(
      student.address
    ).trim()

    const admissionDate = safeString(
      student.admissionDate
    ).trim()

    const status =
      safeString(student.status).trim() ||
      "Active"

    const photoUrl = safeString(
      student.photoUrl
    ).trim()

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

    /*
     * Make sure the admission number is not already
     * being used by another student.
     */
    const duplicate = await sql`
      SELECT id
      FROM students
      WHERE admission_number = ${admissionNo}
        AND id <> ${studentId}
      LIMIT 1
    `

    if (duplicate.length > 0) {
      return Response.json(
        {
          success: false,
          error: `Admission number ${admissionNo} already exists`,
        },
        { status: 409 }
      )
    }

    const result = await sql`
      UPDATE students
      SET
        admission_number = ${admissionNo},
        first_name = ${firstName},
        middle_name = ${middleName || null},
        last_name = ${lastName},
        gender = ${gender},
        date_of_birth = ${dateOfBirth || null},
        class_name = ${className},
        stream = ${stream},
        parent_name = ${guardianName},
        parent_phone = ${guardianPhone},
        address = ${address || null},
        admission_date = ${admissionDate || null},
        status = ${status},
        photo_url = ${photoUrl || null}
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
        status,
        photo_url
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
        firstName: safeString(
          s.first_name
        ),
        middleName: safeString(
          s.middle_name
        ),
        lastName: safeString(
          s.last_name
        ),
        gender:
          safeString(s.gender) || "Male",
        classId: safeString(
          s.class_name
        ),
        className: safeString(
          s.class_name
        ),
        stream: safeString(
          s.stream
        ),
        dateOfBirth: formatDate(
          s.date_of_birth
        ),
        guardianName: safeString(
          s.parent_name
        ),
        guardianPhone: safeString(
          s.parent_phone
        ),
        address: safeString(
          s.address
        ),
        email: "",
        admissionDate: formatDate(
          s.admission_date
        ),
        status:
          safeString(s.status) || "Active",
        photoUrl: safeString(
          s.photo_url
        ),
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
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
}

/* =========================================================
   DELETE STUDENT
   ========================================================= */

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
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
}
