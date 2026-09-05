import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link"
        },
        { status: 400 }
      )
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required"
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters"
        },
        { status: 400 }
      )
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    const sql = getDb()

    const tokens = await sql`
      SELECT id, user_id
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `

    if (tokens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link"
        },
        { status: 400 }
      )
    }

    const resetToken = tokens[0]

    const passwordHash = await bcrypt.hash(password, 12)

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${resetToken.user_id}
    `

    await sql`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = ${resetToken.id}
    `

    await sql`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = ${resetToken.user_id}
        AND used_at IS NULL
        AND id <> ${resetToken.id}
    `

    return NextResponse.json({
      success: true,
      message: "Password reset successfully"
    })
  } catch (error) {
    console.error("Reset password error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Unable to reset password"
      },
      { status: 500 }
    )
  }
}
