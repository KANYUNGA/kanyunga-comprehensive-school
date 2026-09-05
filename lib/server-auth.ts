import { cookies } from "next/headers"
import crypto from "crypto"

const COOKIE_NAME = "school_session"

function getSecret() {
  const secret = process.env.AUTH_SECRET

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured")
  }

  return secret
}

export function createSessionToken(userId: number | string) {
  const payload = String(userId)
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex")

  return `${payload}.${signature}`
}

function verifySessionToken(token: string) {
  const [userId, signature] = token.split(".")

  if (!userId || !signature) return null

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(userId)
    .digest("hex")

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  ) {
    return null
  }

  return userId
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  const userId = verifySessionToken(token)

  if (!userId) return null

  const { getDb } = await import("@/lib/db")
  const sql = getDb()

  const users = await sql`
    SELECT id, username, full_name, role, status
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `

  if (users.length === 0) return null

  const user = users[0]

  if (user.status !== "Active") return null

  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      authorized: false as const,
      response: Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
  }

  if (String(user.role).toLowerCase() !== "admin") {
    return {
      authorized: false as const,
      response: Response.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }
  }

  return {
    authorized: true as const,
    user
  }
}
