import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const sql = getDb()

    const users = await sql`
      SELECT id, username, full_name, role, password_hash, status
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid username" },
        { status: 401 }
      )
    }

    const user = users[0]

    if (user.status !== "Active") {
      return NextResponse.json(
        { success: false, message: "Account inactive" },
        { status: 403 }
      )
    }

    if (user.password_hash !== password) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    )
  }
}
