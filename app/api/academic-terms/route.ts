
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

export async function GET() {
  try {
    const terms = await sql`
      SELECT
        id,
        academic_year,
        term,
        start_date,
        end_date,
        status,
        created_at
      FROM academic_terms
      ORDER BY academic_year DESC, start_date ASC
    `

    return Response.json({
      success: true,
      terms,
    })
  } catch (error) {
    console.error("Failed to fetch academic terms:", error)

    return Response.json(
      {
        success: false,
        error: "Failed to fetch academic terms",
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

    const academicYear = Number(body.academicYear)
    const term = body.term
    const startDate = body.startDate
    const endDate = body.endDate
    const status = body.status ?? "Upcoming"

    if (!academicYear || !term || !startDate || !endDate) {
      return Response.json(
        {
          success: false,
          error: "Academic year, term, start date and end date are required",
        },
        { status: 400 }
      )
    }

    if (!["Term 1", "Term 2", "Term 3"].includes(term)) {
      return Response.json(
        {
          success: false,
          error: "Term must be Term 1, Term 2 or Term 3",
        },
        { status: 400 }
      )
    }

    if (!["Upcoming", "Current", "Closed"].includes(status)) {
      return Response.json(
        {
          success: false,
          error: "Invalid term status",
        },
        { status: 400 }
      )
    }

    // Only one term can be Current.
    if (status === "Current") {
      await sql`
        UPDATE academic_terms
        SET status = 'Upcoming'
        WHERE status = 'Current'
      `
    }

    const result = await sql`
      INSERT INTO academic_terms (
        academic_year,
        term,
        start_date,
        end_date,
        status
      )
      VALUES (
        ${academicYear},
        ${term},
        ${startDate},
        ${endDate},
        ${status}
      )
      RETURNING
        id,
        academic_year,
        term,
        start_date,
        end_date,
        status,
        created_at
    `

    return Response.json(
      {
        success: true,
        term: result[0],
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Failed to create academic term:", error)

    if (error?.code === "23505") {
      return Response.json(
        {
          success: false,
          error: "This academic year and term already exist",
        },
        { status: 409 }
      )
    }

    return Response.json(
      {
        success: false,
        error: "Failed to create academic term",
      },
      { status: 500 }
    )
  }
}
