import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const sql = getDb()
    const result = await sql`SELECT NOW() AS database_time`

    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      data: result,
    })
  } catch (error) {
    console.error('Database connection error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
      },
      { status: 500 }
    )
  }
        }
