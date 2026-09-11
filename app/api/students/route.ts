import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

function mapStudent(s: any) {
  return {
    id: String(s.id),
    admissionNo: s.admission_number ?? "",
    firstName: s.first_name ?? "",
    middleName: s.middle_name ?? "",
    lastName: s.last_name ?? "",
    gender: s.gender ?? "Male",
    classId: s.class_name ?? "",
    className: s.class_name ?? "",
    stream: s.stream ?? "",
    dateOfBirth: s.date_of_birth
      ? new Date(s.date_of_birth).toISOString().slice(0, 10)
      : "",
    guardianName: s.parent_name ?? "",
    guardianPhone: s.parent_phone ?? "",
    address: s.address ?? "",
    email: "",
    admissionDate: s.admission_date
      ? new Date(s.admission_date).toISOString().slice(0, 10)
      : "",
    status: s.status ?? "Active",
    photoUrl: s.photo_url ?? "",
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = Number(id)

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return Response.json(
        { error: "Invalid student ID" },
        { status: 400 }
      )
    }

    const result = await sql`
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
        photo_url
      FROM students
      WHERE id = ${studentId}
      LIMIT 1
    `

    if (result.length === 0) {
      return Response.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    return Response.json(mapStudent(result[0]))
  } catch (error) {
    console.error("Failed to fetch student:", error)

    return Response.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    )
  }
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
    const studentId = Number(id)

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return Response.json(
        { error: "Invalid student ID" },
        { status: 400 }
      )
    }

    const student = await request.json()

    const className =
      student.className?.toString().trim() ||
      student.classId?.toString().trim() ||
      ""

    if (!className) {
      return Response.json(
        { error: "Class is required" },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE students
      SET
        admission_number = ${student.admissionNo},
        first_name = ${student.firstName},
        middle_name = ${student.middleName || null},
        last_name = ${student.lastName},
        gender = ${student.gender},
        date_of_birth = ${student.dateOfBirth || null},
        class_name = ${className},
        stream = ${student.stream || ""},
        parent_name = ${student.guardianName || ""},
        parent_phone = ${student.guardianPhone || ""},
        address = ${student.address || null},
        admission_date = ${student.admissionDate || null},
        status = ${student.status || "Active"},
        photo_url = ${student.photoUrl || null}
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
        { error: "Student not found" },
        { status: 404 }
      )
    }

    return Response.json(mapStudent(result[0]))
  } catch (error) {
    console.error("Failed to update student:", error)

    return Response.json(
      {
        error: "Failed to update student",
        detail:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
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
        { error: "Invalid student ID" },
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
        { error: "Student not found" },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      id: String(studentId),
    })
  } catch (error) {
    console.error("Failed to delete student:", error)

    return Response.json(
      { error: "Failed to delete student" },
      { status: 500 }
    )
  }
}
