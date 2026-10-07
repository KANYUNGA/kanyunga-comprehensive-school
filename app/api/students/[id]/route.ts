import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

function safeString(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function formatDate(value: unknown): string {
  if (!value) return ""

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return String(value).slice(0, 10)
}

function mapStudent(row: any) {
  return {
    id: Number(row.id),
    admissionNo: safeString(row.admission_number),
    firstName: safeString(row.first_name),
    middleName: safeString(row.middle_name),
    lastName: safeString(row.last_name),
    gender: safeString(row.gender) || "Male",

    classId: safeString(row.class_name),
    className: safeString(row.class_name),

    stream: safeString(row.stream),

    dateOfBirth: formatDate(row.date_of_birth),

    guardianName: safeString(row.parent_name),
    guardianPhone: safeString(row.parent_phone),

    address: safeString(row.address),
    email: safeString(row.email),

    admissionDate: formatDate(row.admission_date),

    status: safeString(row.status) || "Active",

    hasPhoto: Boolean(row.has_photo),
  }
}

function getId(params: { id: string }) {
  const id = Number(params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  return id
}

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const resolvedParams = await params
    const id = getId(resolvedParams)

    if (!id) {
      return Response.json(
        {
          error: "Invalid student ID.",
        },
        {
          status: 400,
        }
      )
    }

    const body = await request.json()

    const admissionNo = safeString(body.admissionNo)
    const firstName = safeString(body.firstName)
    const middleName = safeString(body.middleName)
    const lastName = safeString(body.lastName)

    const gender =
      safeString(body.gender) || "Male"

    const className =
      safeString(body.className) ||
      safeString(body.classId)

    const stream = safeString(body.stream)

    const dateOfBirth =
      safeString(body.dateOfBirth) || null

    const guardianName =
      safeString(body.guardianName)

    const guardianPhone =
      safeString(body.guardianPhone)

    const address =
      safeString(body.address)

    const email =
      safeString(body.email)

    const admissionDate =
      safeString(body.admissionDate) || null

    const status =
      safeString(body.status) || "Active"

    const photoUrl =
      safeString(body.photoUrl) || null

    if (!admissionNo) {
      return Response.json(
        {
          error: "Admission number is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (!firstName) {
      return Response.json(
        {
          error: "First name is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (!lastName) {
      return Response.json(
        {
          error: "Last name is required.",
        },
        {
          status: 400,
        }
      )
    }

    if (!className) {
      return Response.json(
        {
          error: "Class is required.",
        },
        {
          status: 400,
        }
      )
    }

    // Prevent assigning another student's admission number.
    const duplicate = await sql`
      SELECT id
      FROM students
      WHERE admission_number = ${admissionNo}
        AND id <> ${id}
      LIMIT 1
    `

    if (duplicate.length > 0) {
      return Response.json(
        {
          error: `Admission number ${admissionNo} already belongs to another student.`,
        },
        {
          status: 409,
        }
      )
    }

    const updated = await sql`
      UPDATE students
      SET
        admission_number = ${admissionNo},
        first_name = ${firstName},
        middle_name = ${middleName},
        last_name = ${lastName},
        gender = ${gender},
        date_of_birth = ${dateOfBirth},
        class_name = ${className},
        stream = ${stream},
        parent_name = ${guardianName},
        parent_phone = ${guardianPhone},
        address = ${address},
        email = ${email},
        admission_date = ${admissionDate},
        status = ${status},
        photo_url = ${photoUrl}
      WHERE id = ${id}
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
        email,
        admission_date,
        status,
        CASE
          WHEN photo_url IS NOT NULL
            AND LENGTH(TRIM(photo_url)) > 0
          THEN true
          ELSE false
        END AS has_photo
    `

    if (updated.length === 0) {
      return Response.json(
        {
          error: "Student not found.",
        },
        {
          status: 404,
        }
      )
    }

    return Response.json(mapStudent(updated[0]))
  } catch (error) {
    console.error("Failed to update student:", error)

    return Response.json(
      {
        error: "Failed to update student.",
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const resolvedParams = await params
    const id = getId(resolvedParams)

    if (!id) {
      return Response.json(
        {
          error: "Invalid student ID.",
        },
        {
          status: 400,
        }
      )
    }

    const deleted = await sql`
      DELETE FROM students
      WHERE id = ${id}
      RETURNING id
    `

    if (deleted.length === 0) {
      return Response.json(
        {
          error: "Student not found.",
        },
        {
          status: 404,
        }
      )
    }

    return Response.json({
      success: true,
      id,
    })
  } catch (error) {
    console.error("Failed to delete student:", error)

    return Response.json(
      {
        error: "Failed to delete student.",
      },
      {
        status: 500,
      }
    )
  }
}
