
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/server-auth'

const sql = getDb()

function clean(value: unknown): string {
  return value == null ? '' : String(value)
}

function dateOnly(value: unknown): string {
  if (!value) return ''

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  const text = String(value)

  if (text.includes('T')) {
    return text.slice(0, 10)
  }

  return text.slice(0, 10)
}

function mapStudent(row: any) {
  return {
    id: String(row.id),
    admissionNo: clean(row.admission_number),
    firstName: clean(row.first_name),
    middleName: clean(row.middle_name),
    lastName: clean(row.last_name),
    gender: clean(row.gender),
    classId: clean(row.class_name),
    className: clean(row.class_name),
    stream: clean(row.stream),
    dateOfBirth: dateOnly(row.date_of_birth),
    guardianName: clean(row.parent_name),
    guardianPhone: clean(row.parent_phone),
    address: clean(row.address),
    email: clean(row.email),
    admissionDate: dateOnly(row.admission_date),
    status: clean(row.status) || 'Active',
    photoUrl: clean(row.photo_url),
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
        photo_url,
        created_at
      FROM students
      ORDER BY
        class_name ASC,
        first_name ASC,
        last_name ASC,
        id ASC
    `

    return Response.json(
      students.map(mapStudent),
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('GET /api/students failed:', error)

    return Response.json(
      {
        success: false,
        error: 'Failed to load students',
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
    const body = await request.json()

    const admissionNo = clean(
      body.admissionNo ??
        body.admission_number
    ).trim()

    const firstName = clean(
      body.firstName ??
        body.first_name
    ).trim()

    const middleName = clean(
      body.middleName ??
        body.middle_name
    ).trim()

    const lastName = clean(
      body.lastName ??
        body.last_name
    ).trim()

    const gender = clean(body.gender).trim()

    const className = clean(
      body.classId ??
        body.className ??
        body.class_name
    ).trim()

    const stream = clean(body.stream).trim()

    const dateOfBirth = clean(
      body.dateOfBirth ??
        body.date_of_birth
    ).trim()

    const guardianName = clean(
      body.guardianName ??
        body.guardian_name ??
        body.parentName ??
        body.parent_name
    ).trim()

    const guardianPhone = clean(
      body.guardianPhone ??
        body.guardian_phone ??
        body.parentPhone ??
        body.parent_phone
    ).trim()

    const address = clean(body.address).trim()

    const email = clean(body.email).trim()

    const admissionDate =
      clean(
        body.admissionDate ??
          body.admission_date
      ).trim() ||
      new Date().toISOString().slice(0, 10)

    const status =
      clean(body.status).trim() || 'Active'

    const photoUrl = clean(
      body.photoUrl ??
        body.photo_url
    ).trim()

    if (!admissionNo) {
      return Response.json(
        { error: 'Admission number is required' },
        { status: 400 }
      )
    }

    if (!firstName) {
      return Response.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!lastName) {
      return Response.json(
        { error: 'Last name is required' },
        { status: 400 }
      )
    }

    if (!className) {
      return Response.json(
        { error: 'Class is required' },
        { status: 400 }
      )
    }

    const existing = await sql`
      SELECT id
      FROM students
      WHERE admission_number = ${admissionNo}
      LIMIT 1
    `

    if (existing.length > 0) {
      return Response.json(
        {
          error:
            'A student with this admission number already exists',
        },
        { status: 409 }
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
        ${dateOfBirth || null},
        ${className},
        ${stream},
        ${guardianName},
        ${guardianPhone},
        ${address},
        ${email},
        ${admissionDate || null},
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
        photo_url,
        created_at
    `

    return Response.json(
      mapStudent(inserted[0]),
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/students failed:', error)

    return Response.json(
      {
        success: false,
        error: 'Failed to create student',
      },
      { status: 500 }
    )
  }
}
