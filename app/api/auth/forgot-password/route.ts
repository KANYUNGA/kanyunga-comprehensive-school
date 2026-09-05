import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { Resend } from "resend"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    const genericResponse = NextResponse.json({
      success: true,
      message:
        "If that recovery email is registered, a password reset link will be sent."
    })

    if (!email || typeof email !== "string") {
      return genericResponse
    }

    const recoveryEmail = email.trim()

    const sql = getDb()

    const users = await sql`
      SELECT
        id,
        full_name,
        personal_email,
        status
      FROM users
      WHERE LOWER(personal_email) = LOWER(${recoveryEmail})
      LIMIT 1
    `

    if (users.length === 0) {
      return genericResponse
    }

    const user = users[0]

    if (user.status !== "Active") {
      return genericResponse
    }

    // Create a secure random token.
    const rawToken = crypto.randomBytes(32).toString("hex")

    // Only the hash is stored in the database.
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex")

    // Token expires after 1 hour.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    // Invalidate any previous unused reset tokens.
    await sql`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = ${user.id}
        AND used_at IS NULL
    `

    // Store the new hashed token.
    await sql`
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (
        ${user.id},
        ${tokenHash},
        ${expiresAt}
      )
    `

    const appUrl =
      process.env.APP_URL || "https://kanyunga.vercel.app"

    const resetUrl =
      `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "onboarding@resend.dev",
      to: [recoveryEmail],
      subject: "Kanyunga Comprehensive School - Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>

          <p>Hello ${user.full_name || "there"},</p>

          <p>
            We received a request to reset your Kanyunga Comprehensive School
            account password.
          </p>

          <p>
            Click the button below to create a new password:
          </p>

          <p>
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
              "
            >
              Reset My Password
            </a>
          </p>

          <p>
            This link will expire in <strong>1 hour</strong>.
          </p>

          <p>
            If you did not request a password reset, you can safely ignore
            this email.
          </p>

          <p>
            Regards,<br />
            Kanyunga Comprehensive School
          </p>
        </div>
      `
    })

    if (error) {
      console.error("Resend email error:", error)

      // Invalidate the token because the email was not sent.
      await sql`
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = ${user.id}
          AND token_hash = ${tokenHash}
          AND used_at IS NULL
      `

      return NextResponse.json(
        {
          success: false,
          message: "Unable to send password reset email"
        },
        { status: 500 }
      )
    }

    console.log(
      `Password reset email sent for user ID ${user.id}`
    )

    return genericResponse
  } catch (error) {
    console.error("Forgot password error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process password reset request"
      },
      { status: 500 }
    )
  }
}