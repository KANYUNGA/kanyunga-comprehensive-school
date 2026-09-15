
import { getDb } from '@/lib/db'

const sql = getDb()

export async function GET() {
  try {
    const [
      studentsResult,
      teachersResult,
      classesResult,
      subjectsResult,
    ] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS count
        FROM students
      `,

      sql`
        SELECT COUNT(*)::int AS count
        FROM teachers
      `,

      sql`
        SELECT COUNT(*)::int AS count
        FROM classes
      `,

      sql`
        SELECT COUNT(*)::int AS count
        FROM subjects
      `,
    ])

    return Response.json({
      success: true,
      students: Number(studentsResult[0]?.count ?? 0),
      teachers: Number(teachersResult[0]?.count ?? 0),
      classes: Number(classesResult[0]?.count ?? 0),
      subjects: Number(subjectsResult[0]?.count ?? 0),
    })
  } catch (error) {
    console.error('Dashboard statistics error:', error)

    return Response.json(
      {
        success: false,
        error: 'Failed to load dashboard statistics',
      },
      { status: 500 }
    )
  }
}
