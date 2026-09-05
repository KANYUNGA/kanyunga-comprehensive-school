import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getCurrentUser } from '@/lib/server-auth'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Get the current password hash
    const users = await sql`
      SELECT password_hash 
      FROM users 
      WHERE id = ${user.id}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash)

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    const newHash = await bcrypt.hash(newPassword, 12)

    await sql`
      UPDATE users 
      SET password_hash = ${newHash}
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to change password' },
      { status: 500 }
    )
  }
}
