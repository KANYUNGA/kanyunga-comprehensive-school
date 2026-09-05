import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

function mapExam(exam: any) {
  return {
    id: exam.legacy_id ?? String(exam.id),
    name: exam.exam_name ?? "",
    term: exam.term ?? "",
    year: Number(exam.year ?? 0),
    outOf: 100,
  }
}

export async function GET() {
  try {
    const exams = await sql`
      SELECT
        id,
        legacy_id,
        exam_name,
        term,
        year,
        class_id,
        start_date,
        end_date,
        created_at
      FROM exams
      ORDER BY year DESC, id DESC
    `

    return Response.json(exams.map(mapExam))
  } catch (error) {
    console.error("Failed to fetch exams:", error)

    return Response.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const examData = await request.json()

    if (!examData.name) {
      return Response.json(
        { error: "Exam name is required" },
        { status: 400 }
      )
    }

    if (!examData.term) {
      return Response.json(
        { error: "Exam term is required" },
        { status: 400 }
      )
    }

    const year = Number(examData.year)

    if (!Number.isInteger(year)) {
      return Response.json(
        { error: "Exam year must be a valid integer" },
        { status: 400 }
      )
    }

    const legacyId = examData.id || null

    const result = await sql`
      INSERT INTO exams (
        legacy_id,
        exam_name,
        term,
        year
      )
      VALUES (
        ${legacyId},
        ${examData.name},
        ${examData.term},
        ${year}
      )
      RETURNING
        id,
        legacy_id,
        exam_name,
        term,
        year
    `

    return Response.json(mapExam(result[0]), { status: 201 })
  } catch (error) {
    console.error("Failed to create exam:", error)

    return Response.json(
      { error: "Failed to create exam" },
      { status: 500 }
    )
  }
}
