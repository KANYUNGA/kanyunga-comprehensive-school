import { sql } from "@/lib/db"

export async function GET() {
  try {
    const payments = await sql`
      SELECT
        id,
        student_id,
        amount,
        payment_date,
        payment_method,
        reference,
        term,
        year,
        created_at
      FROM payments
      ORDER BY payment_date DESC, id DESC
    `

    return Response.json(
      payments.map((p) => ({
        id: String(p.id),
        studentId: String(p.student_id),
        amount: Number(p.amount),
        date: p.payment_date
          ? new Date(p.payment_date).toISOString().slice(0, 10)
          : "",
        method: p.payment_method ?? "Cash",
        reference: p.reference ?? "",
        term: p.term ?? "",
        year: Number(p.year),
      }))
    )
  } catch (error) {
    console.error("Failed to fetch payments:", error)

    return Response.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const payment = await request.json()

    if (!payment.studentId) {
      return Response.json(
        { error: "Student ID is required" },
        { status: 400 }
      )
    }

    if (!payment.amount || Number(payment.amount) <= 0) {
      return Response.json(
        { error: "A valid payment amount is required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO payments (
        student_id,
        amount,
        payment_date,
        payment_method,
        reference,
        term,
        year
      )
      VALUES (
        ${Number(payment.studentId)},
        ${Number(payment.amount)},
        ${payment.date || new Date().toISOString().slice(0, 10)},
        ${payment.method || "Cash"},
        ${payment.reference || ""},
        ${payment.term || ""},
        ${Number(payment.year)}
      )
      RETURNING id
    `

    return Response.json(
      {
        success: true,
        id: String(result[0].id),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create payment:", error)

    return Response.json(
      { error: "Failed to create payment" },
      { status: 500 }
    )
  }
}
