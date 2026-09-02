import { sql } from "@/lib/db"

function mapClass(c: any) {
  return {
    id: String(c.id),
    name: c.class_name ?? "",
    streams: c.stream
      ? String(c.stream)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    classTeacherId: c.class_teacher ? String(c.class_teacher) : null,
  }
}

export async function GET() {
  try {
    const classes = await sql`
      SELECT
        id,
        class_name,
        stream,
        class_teacher,
        created_at
      FROM classes
      ORDER BY id
    `

    return Response.json(classes.map(mapClass))
  } catch (error) {
    console.error("Failed to fetch classes:", error)

    return Response.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const classData = await request.json()

    if (!classData.name) {
      return Response.json(
        { error: "Class name is required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO classes (
        class_name,
        stream,
        class_teacher
      )
      VALUES (
        ${classData.name},
        ${(classData.streams || []).join(",")},
        ${classData.classTeacherId || null}
      )
      RETURNING
        id,
        class_name,
        stream,
        class_teacher
    `

    return Response.json(mapClass(result[0]), { status: 201 })
  } catch (error) {
    console.error("Failed to create class:", error)

    return Response.json(
      { error: "Failed to create class" },
      { status: 500 }
    )
  }
}
