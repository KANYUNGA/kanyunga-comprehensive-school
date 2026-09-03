import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username, full_name, email, password, role } =
      await request.json()

    const sql = getDb()

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
        ${password},
        ${role},
        'Active'
      )
    `

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user'
      },
      { status: 500 }
    )
  }
}
