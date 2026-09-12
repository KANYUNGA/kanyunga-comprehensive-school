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
        admission_date,
        status
      FROM students
      ORDER BY id ASC
    `

    return Response.json(students.map(mapStudent))
  } catch (error) {
    console.error("Failed to fetch students:", error)

    return Response.json(
      {
        error: "Failed to fetch students",
        detail:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const student = await request.json()

    if (!student.admissionNo || !student.firstName) {
      return Response.json(
        {
          error: "Admission number and first name are required",
        },
        { status: 400 }
      )
    }

    if (!student.className && !student.classId) {
      return Response.json(
        { error: "Class is required" },
        { status: 400 }
      )
    }

    const className =
      student.className?.toString().trim() ||
      student.classId?.toString().trim() ||
      ""

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
        status
      )
      VALUES (
        ${student.admissionNo},
        ${student.firstName},
        ${student.middleName || null},
        ${student.lastName || null},
        ${student.gender || "Male"},
        ${student.dateOfBirth || null},
        ${className},
        ${student.stream || ""},
        ${student.guardianName || ""},
        ${student.guardianPhone || ""},
        ${student.address || null},
        ${student.admissionDate || null},
        ${student.status || "Active"}
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
        status
    `

    return Response.json(mapStudent(result[0]), { status: 201 })
  } catch (error) {
    console.error("Failed to create student:", error)

    return Response.json(
      {
        error: "Failed to create student",
        detail:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
          }
