
import { getDb } from "@/lib/db"

const sql = getDb()

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = Number(rawId)

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { error: "Invalid student ID." },
        { status: 400 }
      )
    }

    const rows = await sql`
      SELECT photo_url
      FROM students
      WHERE id = ${id}
      LIMIT 1
    `

    if (rows.length === 0) {
      return Response.json(
        { error: "Student not found." },
        { status: 404 }
      )
    }

    const photo = String(rows[0].photo_url ?? "").trim()

    if (!photo) {
      return new Response(null, { status: 404 })
    }

    // Support photos saved as data:image/...;base64,...
    const match = photo.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/
    )

    if (match) {
      const contentType = match[1]
      const imageBytes = Buffer.from(match[2], "base64")

      return new Response(imageBytes, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    // Also support an existing externally hosted image URL.
    if (/^https?:\/\//i.test(photo)) {
      return Response.redirect(photo)
    }

    return Response.json(
      { error: "The stored photo format is not supported." },
      { status: 415 }
    )
  } catch (error) {
    console.error("Failed to fetch student photo:", error)

    return Response.json(
      { error: "Failed to fetch student photo." },
      { status: 500 }
    )
  }
}

