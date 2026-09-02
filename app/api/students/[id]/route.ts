import { sql } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const student = await request.json()
    const studentId = Number(id)

    if (!Number.isInteger(studentId)) {
      return Response.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    const result = await sql`
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
      WHERE id = ${studentId}
      RETURNING
        id,
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
    `

    if (result.length === 0) {
      return Response.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    const s = result[0]

    return Response.json({
      id: String(s.id),
      admissionNo: s.admission_number ?? '',
      firstName: s.first_name ?? '',
      lastName: s.last_name ?? '',
      gender: s.gender ?? 'Male',
      classId: s.class_name ?? '',
      stream: s.stream ?? '',
      dateOfBirth: s.date_of_birth
        ? String(s.date_of_birth).slice(0, 10)
        : '',
      guardianName: s.parent_name ?? '',
      guardianPhone: s.parent_phone ?? '',
      email: '',
      admissionDate: s.admission_date
        ? String(s.admission_date).slice(0, 10)
        : '',
      status: s.status ?? 'Active',
    })
  } catch (error) {
    console.error('Failed to update student:', error)

    return Response.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = Number(id)

    if (!Number.isInteger(studentId)) {
      return Response.json(
        { error: 'Invalid student ID' },
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
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete student:', error)

    return Response.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
