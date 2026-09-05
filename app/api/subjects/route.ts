import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

function mapSubject(subject: any) {
  return {
    id: subject.legacy_id ?? String(subject.id),
    name: subject.subject_name ?? "",
    code: subject.subject_code ?? "",
    category: subject.description ?? "Sciences",
  }
}

export async function GET() {
  try {
    const subjects = await sql`
      SELECT
        id,
        legacy_id,
        subject_code,
        subject_name,
        description,
        created_at
      FROM subjects
      ORDER BY id
    `

    return Response.json(subjects.map(mapSubject))
  } catch (error) {
    console.error("Failed to fetch subjects:", error)
    return Response.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  try {
    const subject = await request.json()

    if (!subject.name || !subject.code || !subject.category) {
      return Response.json(
        { error: "Name, code, and category are required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO subjects (
        subject_code,
        subject_name,
        description
      )
      VALUES (
        ${subject.code},
        ${subject.name},
        ${subject.category}
      )
      RETURNING
        id,
        subject_code,
        subject_name,
        description
    `

    return Response.json(mapSubject(result[0]), { status: 201 })
  } catch (error) {
    console.error("Failed to create subject:", error)
    return Response.json(
      { error: "Failed to create subject" },
      { status: 500 }
    )
  }
}
