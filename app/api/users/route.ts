import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const {
      username,
      full_name,
      email,
      password,
      role
    } = await request.json()

    if (!username || !full_name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error: "All required fields must be provided"
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters"
        },
        { status: 400 }
      )
    }

    const sql = getDb()

    const passwordHash = await bcrypt.hash(password, 12)

    await sql`
      INSERT INTO users (
        username,
        full_name,
        email,
        password_hash,
        role,
        status
      )
      VALUES (
        ${username},
        ${full_name},
        ${email},
        ${passwordHash},
        ${role},
        'Active'
      )
    `

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error("Create user error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user"
      },
      { status: 500 }
    )
  }
}
