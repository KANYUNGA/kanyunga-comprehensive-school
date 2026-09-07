import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const username = String(body.username ?? "").trim()
    const full_name = String(body.full_name ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const role = String(body.role ?? "").trim().toLowerCase()

    if (!username || !full_name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error: "All required fields must be provided",
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters",
        },
        { status: 400 }
      )
    }

    const allowedRoles = ["admin", "teacher", "parent"]

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user role",
        },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Check whether username or email already exists
    const existing = await sql`
      SELECT id, username, email
      FROM users
      WHERE LOWER(username) = LOWER(${username})
         OR LOWER(email) = LOWER(${email})
      LIMIT 1
    `

    if (existing.length > 0) {
      const user = existing[0]

      if (
        String(user.username).toLowerCase() === username.toLowerCase()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Username already exists",
          },
          { status: 409 }
        )
      }

      if (String(user.email).toLowerCase() === email.toLowerCase()) {
        return NextResponse.json(
          {
            success: false,
            error: "Email address already exists",
          },
          { status: 409 }
        )
      }
    }

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
      success: true,
      message: "User created successfully",
    })
  } catch (error: any) {
    console.error("Create user error:", error)

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          error?.detail ||
          "Failed to create user",
      },
      { status: 500 }
    )
  }
        }
