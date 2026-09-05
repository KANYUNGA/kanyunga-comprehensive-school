import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

function mapTeacher(t: any) {
  return {
    id: String(t.id),
    staffNo: t.teacher_number ?? "",
    firstName: t.first_name ?? "",
    lastName: t.last_name ?? "",
    gender: t.gender ?? "Male",
    phone: t.phone ?? "",
    email: t.email ?? "",
    subjectIds: t.subject
      ? String(t.subject)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    employmentDate: t.employment_date
      ? new Date(t.employment_date).toISOString().slice(0, 10)
      : "",
    status: t.status ?? "Active",
  }
}

export async function GET() {
  try {
    const teachers = await sql`
      SELECT
        id,
        teacher_number,
        first_name,
        last_name,
        gender,
        phone,
        email,
        subject,
        employment_date,
        status,
        created_at
      FROM teachers
      ORDER BY id
    `

    return Response.json(teachers.map(mapTeacher))
  } catch (error) {
    console.error("Failed to fetch teachers:", error)

    return Response.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const teacher = await request.json()

    if (!teacher.firstName || !teacher.lastName) {
      return Response.json(
        { error: "First name and last name are required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO teachers (
        teacher_number,
        first_name,
        last_name,
        gender,
        phone,
        email,
        subject,
        employment_date,
        status
      )
      VALUES (
        ${teacher.staffNo || ""},
        ${teacher.firstName},
        ${teacher.lastName},
        ${teacher.gender || "Male"},
        ${teacher.phone || ""},
        ${teacher.email || ""},
        ${(teacher.subjectIds || []).join(",")},
        ${teacher.employmentDate || null},
        ${teacher.status || "Active"}
      )
      RETURNING
        id,
        teacher_number,
        first_name,
        last_name,
        gender,
        phone,
        email,
        subject,
        employment_date,
        status
    `

    return Response.json(mapTeacher(result[0]), { status: 201 })
  } catch (error) {
    console.error("Failed to create teacher:", error)

    return Response.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    )
  }
}
