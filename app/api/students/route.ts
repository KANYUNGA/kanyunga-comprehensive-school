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

    // IMPORTANT:
    // Do not send the Base64 photo here.
    hasPhoto: Boolean(row.has_photo),
  }
}

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
        email,
        admission_date,
        status,

        CASE
          WHEN photo_url IS NOT NULL
            AND LENGTH(TRIM(photo_url)) > 0
          THEN true
          ELSE false
        END AS has_photo

      FROM students
      ORDER BY
        first_name ASC,
        last_name ASC,
        id ASC
    `

    return Response.json(students.map(mapStudent))
  } catch (error) {
    console.error("Failed to fetch students:", error)

    return Response.json(
      {
        error: "Failed to fetch students",
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const body = await request.json()

    const admissionNo = safeString(body.admissionNo)
    const firstName = safeString(body.firstName)
    const middleName = safeString(body.middleName)
    const lastName = safeString(body.lastName)
    const gender = safeString(body.gender) || "Male"
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

    // Prevent duplicate admission numbers.
    const existing = await sql`
      SELECT id
      FROM students
      WHERE admission_number = ${admissionNo}
      LIMIT 1
    `

    if (existing.length > 0) {
      return Response.json(
        {
          error: `Admission number ${admissionNo} already exists.`,
        },
        {
          status: 409,
        }
      )
    }

    const inserted = await sql`
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
        email,
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
        ${dateOfBirth},
        ${className},
        ${stream},
        ${guardianName},
        ${guardianPhone},
        ${address},
        ${email},
        ${admissionDate},
        ${status},
        ${photoUrl}
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

    return Response.json(
      mapStudent(inserted[0]),
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error("Failed to add student:", error)

    return Response.json(
      {
        error: "Failed to add student.",
      },
      {
        status: 500,
      }
    )
  }
}
