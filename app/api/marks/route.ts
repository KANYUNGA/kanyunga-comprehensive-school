import { sql } from "@/lib/db"

function mapMark(mark: any) {
  return {
    id: String(mark.id),
    examId: mark.legacy_exam_id ?? String(mark.exam_id),
    studentId: String(mark.student_id),
    subjectId: mark.legacy_subject_id ?? String(mark.subject_id),
    score: Number(mark.marks ?? 0),
  }
}

async function resolveExamId(examId: string) {
  const result = await sql`
    SELECT id
    FROM exams
    WHERE legacy_id = ${examId}
       OR id::text = ${examId}
    LIMIT 1
  `

  return result[0]?.id ?? null
}

async function resolveSubjectId(subjectId: string) {
  const numericId = Number(subjectId)

  const result = Number.isInteger(numericId)
    ? await sql`
        SELECT id
        FROM subjects
        WHERE id = ${numericId}
           OR legacy_id = ${subjectId}
        LIMIT 1
      `
    : await sql`
        SELECT id
        FROM subjects
        WHERE legacy_id = ${subjectId}
        LIMIT 1
      `

  return result[0]?.id ?? null
}

async function resolveStudentId(studentId: string) {
  const numericId = Number(studentId)

  if (!Number.isInteger(numericId)) {
    return null
  }

  const result = await sql`
    SELECT id
    FROM students
    WHERE id = ${numericId}
    LIMIT 1
  `

  return result[0]?.id ?? null
}

export async function GET() {
  try {
    const marks = await sql`
      SELECT
        m.id,
        m.student_id,
        m.exam_id,
        m.subject_id,
        m.marks,
        e.legacy_id AS legacy_exam_id,
        s.legacy_id AS legacy_subject_id
      FROM marks m
      LEFT JOIN exams e ON e.id = m.exam_id
      LEFT JOIN subjects s ON s.id = m.subject_id
      ORDER BY m.id
    `

    return Response.json(marks.map(mapMark))
  } catch (error) {
    console.error("Failed to fetch marks:", error)

    return Response.json(
      { error: "Failed to fetch marks" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const examId = String(body.examId ?? "")
    const entries = Array.isArray(body.entries) ? body.entries : []

    if (!examId) {
      return Response.json(
        { error: "Exam ID is required" },
        { status: 400 }
      )
    }

    if (entries.length === 0) {
      return Response.json(
        { error: "At least one mark is required" },
        { status: 400 }
      )
    }

    const databaseExamId = await resolveExamId(examId)

    if (databaseExamId === null) {
      return Response.json(
        { error: `Exam not found: ${examId}` },
        { status: 404 }
      )
    }

    for (const entry of entries) {
      const studentId = String(entry.studentId ?? "")
      const subjectId = String(entry.subjectId ?? "")
      const score = Number(entry.score)

      if (!studentId || !subjectId || !Number.isFinite(score)) {
        continue
      }

      const databaseStudentId = await resolveStudentId(studentId)
      const databaseSubjectId = await resolveSubjectId(subjectId)

      if (databaseStudentId === null) {
        console.warn(`Student not found: ${studentId}`)
        continue
      }

      if (databaseSubjectId === null) {
        console.warn(`Subject not found: ${subjectId}`)
        continue
      }

      const safeScore = Math.max(0, Math.min(100, score))

      const existing = await sql`
        SELECT id
        FROM marks
        WHERE student_id = ${databaseStudentId}
          AND exam_id = ${databaseExamId}
          AND subject_id = ${databaseSubjectId}
        LIMIT 1
      `

      if (existing.length > 0) {
        await sql`
          UPDATE marks
          SET marks = ${safeScore}
          WHERE id = ${existing[0].id}
        `
      } else {
        await sql`
          INSERT INTO marks (
            student_id,
            exam_id,
            subject_id,
            marks
          )
          VALUES (
            ${databaseStudentId},
            ${databaseExamId},
            ${databaseSubjectId},
            ${safeScore}
          )
        `
      }
    }

    return Response.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to save marks:", error)

    return Response.json(
      { error: "Failed to save marks" },
      { status: 500 }
    )
  }
}
