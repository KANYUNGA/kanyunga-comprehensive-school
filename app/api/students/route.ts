import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

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
        created_at
      FROM students
      ORDER BY id
    `

    return Response.json(
      students.map((s) => ({
        id: String(s.id),
        admissionNo: s.admission_number ?? '',
        firstName: s.first_name ?? '',
        lastName: s.last_name ?? '',
        gender: s.gender ?? 'Male',
        classId: s.class_name ?? '',
        stream: s.stream ?? '',
dateOfBirth: s.date_of_birth
  ? new Date(s.date_of_birth).toISOString().slice(0, 10)
  : '',
        guardianName: s.parent_name ?? '',
        guardianPhone: s.parent_phone ?? '',
        email: '',
admissionDate: s.admission_date
  ? new Date(s.admission_date).toISOString().slice(0, 10)
  : '',
        status: s.status ?? 'Active',
      }))
    )
  } catch (error) {
    console.error('Failed to fetch students:', error)
    return Response.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const student = await request.json()

    const result = await sql`
      INSERT INTO students (
        admission_number,
        first_name,
        last_name,
        gender,
        date_of_birth,
        class_name,
        stream,
        parent_name,
        parent_phone,
        admission_date,
        status
      )
      VALUES (
        ${student.admissionNo},
        ${student.firstName},
        ${student.lastName},
        ${student.gender},
        ${student.dateOfBirth || null},
        ${student.classId},
        ${student.stream},
        ${student.guardianName},
        ${student.guardianPhone},
        ${student.admissionDate || null},
        ${student.status || 'Active'}
      )
      RETURNING id
    `

    return Response.json(
      { success: true, id: String(result[0].id) },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create student:', error)
    return Response.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const student = await request.json()

    if (!student.id) {
      return Response.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    await sql`
      UPDATE students
      SET
        admission_number = ${student.admissionNo},
        first_name = ${student.firstName},
        last_name = ${student.lastName},
        gender = ${student.gender},
        date_of_birth = ${student.dateOfBirth || null},
        class_name = ${student.classId},
        stream = ${student.stream},
        parent_name = ${student.guardianName},
        parent_phone = ${student.guardianPhone},
        admission_date = ${student.admissionDate || null},
        status = ${student.status || 'Active'}
      WHERE id = ${Number(student.id)}
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to update student:', error)
    return Response.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const { id } = await request.json()

    if (!id) {
      return Response.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    await sql`
      DELETE FROM students
      WHERE id = ${Number(id)}
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete student:', error)
    return Response.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
