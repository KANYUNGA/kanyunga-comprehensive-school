import { getDb } from "@/lib/db"

const sql = getDb()

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const resolvedParams = await params
    const id = Number(resolvedParams.id)

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        {
          error: "Invalid student ID.",
        },
        {
          status: 400,
        }
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
        {
          error: "Student not found.",
        },
        {
          status: 404,
        }
      )
    }

    const photoUrl = String(
      rows[0].photo_url ?? ""
    ).trim()

    if (!photoUrl) {
      return Response.json({
        success: true,
        photoUrl: "",
      })
    }

    return Response.json({
      success: true,
      photoUrl,
    })
  } catch (error) {
    console.error("Failed to fetch student photo:", error)

    return Response.json(
      {
        error: "Failed to fetch student photo.",
      },
      {
        status: 500,
      }
    )
  }
}
