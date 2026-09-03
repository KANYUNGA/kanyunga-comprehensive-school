import { getDb } from "@/lib/db"

const sql = getDb()

export async function GET() {
  try {
    const fees = await sql`
      SELECT
        id,
        student_id,
        term,
        year,
        amount_required,
        amount_paid,
        balance
      FROM fees
      ORDER BY id
    `

    return Response.json(
      fees.map((f) => ({
        id: String(f.id),
        studentId: String(f.student_id),
        term: f.term ?? "",
        year: Number(f.year),
        amountRequired: Number(f.amount_required ?? 0),
        amountPaid: Number(f.amount_paid ?? 0),
        balance: Number(f.balance ?? 0),
      }))
    )
  } catch (error) {
    console.error("Failed to fetch fees:", error)

    return Response.json(
      { error: "Failed to fetch fees" },
      { status: 500 }
    )
  }
}
