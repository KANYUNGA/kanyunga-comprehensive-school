import { getDb } from "@/lib/db"

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teacher = await request.json()

    const result = await sql`
      UPDATE teachers
      SET
        teacher_number = ${teacher.staffNo || ""},
        first_name = ${teacher.firstName || ""},
        last_name = ${teacher.lastName || ""},
        gender = ${teacher.gender || "Male"},
        phone = ${teacher.phone || ""},
        email = ${teacher.email || ""},
        subject = ${(teacher.subjectIds || []).join(",")},
        employment_date = ${teacher.employmentDate || null},
        status = ${teacher.status || "Active"}
      WHERE id = ${Number(id)}
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

    if (!result.length) {
      return Response.json(
        { error: "Teacher not found" },
        { status: 404 }
      )
    }

    return Response.json(mapTeacher(result[0]))
  } catch (error) {
    console.error("Failed to update teacher:", error)
    return Response.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await sql`
      DELETE FROM teachers
      WHERE id = ${Number(id)}
      RETURNING id
    `

    if (!result.length) {
      return Response.json(
        { error: "Teacher not found" },
        { status: 404 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to delete teacher:", error)
    return Response.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    )
  }
}
