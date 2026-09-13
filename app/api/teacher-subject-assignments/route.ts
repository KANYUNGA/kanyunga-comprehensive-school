import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/server-auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const sql = getDb()

    const assignments = await sql`
      SELECT
        a.id AS assignment_id,
        a.teacher_id,
        a.subject_id,
        s.subject_name,
        s.subject_code,
        a.class_id,
        c.class_name
      FROM teacher_subject_assignments a
      LEFT JOIN subjects s
        ON s.id = a.subject_id
      LEFT JOIN classes c
        ON c.id = a.class_id
      ORDER BY c.class_name, s.subject_name
    `

    return NextResponse.json({
      success: true,
      data: assignments,
    })
  } catch (error) {
    console.error("Teacher subject assignments error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load teacher assignments",
      },
      { status: 500 }
    )
  }
}
