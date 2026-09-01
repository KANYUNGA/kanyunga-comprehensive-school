import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const sql = getDb()

    const students = await sql`
      SELECT
        "Id" AS id,
        "Admission number" AS admission_no,
        "First name" AS first_name,
        "Middle name" AS middle_name,
        "Last name" AS last_name,
        "Gender" AS gender,
        "Date of birth" AS date_of_birth,
        "Class name" AS class_name,
        "Stream" AS stream,
        "Parent name" AS parent_name,
        "Parent phone" AS parent_phone,
        "Adresss" AS address,
        "Admission date" AS admission_date,
        "Status" AS status
      FROM "Students"
      ORDER BY "Id" DESC
    `

    return NextResponse.json(students)
  } catch (error) {
    console.error('Failed to fetch students:', error)

    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 },
    )
  }
}
