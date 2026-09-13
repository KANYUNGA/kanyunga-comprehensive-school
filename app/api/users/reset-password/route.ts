import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()

    if (!auth.authorized) {
      return auth.response
    }

    const { userId, password } = await req.json()

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: "User ID and password are required" },
        { status: 400 }
      )
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const sql = getDb()

    const users = await sql`
      SELECT id, username, email
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: "Password reset successfully"
    })
  } catch (error) {
    console.error("Reset password error:", error)

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    )
  }
}
