import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/server-auth"

const sql = getDb()

function mapMark(mark: any) {
  return {
    id: String(mark.id),
    examId:
      mark.legacy_exam_id ??
      String(mark.exam_id),
    studentId: String(mark.student_id),
    subjectId:
      mark.legacy_subject_id ??
      String(mark.subject_id),
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

async function resolveSubjectId(
  subjectId: string,
) {
  const numericId = Number(subjectId)

  const result = Number.isInteger(
    numericId,
  )
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

async function resolveStudentId(
  studentId: string,
) {
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

async function getTeacherIdForUser(
  userId: number,
) {
  const result = await sql`
    SELECT teacher_id
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `

  return result[0]?.teacher_id ?? null
}

async function getStudentClass(
  studentId: number,
) {
  const result = await sql`
    SELECT
      s.id,
      s.class_name,
      c.id AS class_id,
      c.class_name AS database_class_name
    FROM students s
    LEFT JOIN classes c
      ON LOWER(TRIM(c.class_name)) =
         LOWER(TRIM(s.class_name))
    WHERE s.id = ${studentId}
    LIMIT 1
  `

  return result[0] ?? null
}

async function teacherCanEnterMarks(
  teacherId: number,
  studentId: number,
  subjectId: number,
) {
  const student =
    await getStudentClass(studentId)

  if (!student) {
    return {
      allowed: false,
      reason: "Student record not found.",
    }
  }

  if (!student.class_id) {
    return {
      allowed: false,
      reason:
        "The student's class is not linked to a class record.",
    }
  }

  const className = String(
    student.database_class_name ??
      student.class_name ??
      "",
  )
    .trim()
    .toLowerCase()

  /*
   * Playgroup, PP1, PP2 and Grades 1–3:
   * the class teacher teaches all subjects
   * in their own class.
   */
  const earlyClasses = [
    "playgroup",
    "play group",
    "pp1",
    "preprimary 1",
    "pp2",
    "preprimary 2",
    "grade 1",
    "grade 2",
    "grade 3",
  ]

  if (earlyClasses.includes(className)) {
    const classTeacher = await sql`
      SELECT id
      FROM classes
      WHERE id = ${student.class_id}
        AND class_teacher = ${teacherId}
      LIMIT 1
    `

    if (classTeacher.length > 0) {
      return {
        allowed: true,
        reason:
          "Class teacher of own class.",
      }
    }
  }

  /*
   * Grades 4–9 and other classes:
   * teacher must have an explicit
   * teacher + subject + class assignment.
   */
  const assignment = await sql`
    SELECT a.id
    FROM teacher_subject_assignments a
    WHERE a.teacher_id = ${teacherId}
      AND a.subject_id = ${subjectId}
      AND a.class_id = ${student.class_id}
    LIMIT 1
  `

  if (assignment.length > 0) {
    return {
      allowed: true,
      reason:
        "Assigned subject teacher.",
    }
  }

  return {
    allowed: false,
    reason:
      "You are not assigned to teach this subject in this class.",
  }
}

/* =========================================================
   GET MARKS
   ========================================================= */

export async function GET(
  request: Request,
) {
  try {
    const { searchParams } =
      new URL(request.url)

    const examId =
      searchParams.get("examId")

    const classId =
      searchParams.get("classId")

    const subjectId =
      searchParams.get("subjectId")

    /*
     * IMPORTANT:
     *
     * If an exam is supplied, only retrieve
     * marks for that exam.
     *
     * This prevents the Marks page from
     * downloading the entire marks table.
     */

    if (examId) {
      const databaseExamId =
        await resolveExamId(examId)

      if (databaseExamId === null) {
        return Response.json(
          {
            error:
              `Exam not found: ${examId}`,
          },
          {
            status: 404,
          },
        )
      }

      /*
       * Optional subject filter.
       */
      if (subjectId) {
        const databaseSubjectId =
          await resolveSubjectId(
            subjectId,
          )

        if (
          databaseSubjectId === null
        ) {
          return Response.json(
            {
              error:
                `Subject not found: ${subjectId}`,
            },
            {
              status: 404,
            },
          )
        }

        /*
         * Optional class filter.
         *
         * Student class is matched using
         * the student's class_name.
         */
        if (classId) {
          const numericClassId =
            Number(classId)

          if (
            !Number.isInteger(
              numericClassId,
            )
          ) {
            return Response.json(
              {
                error:
                  "Invalid class ID.",
              },
              {
                status: 400,
              },
            )
          }

          const marks =
            await sql`
              SELECT
                m.id,
                m.student_id,
                m.exam_id,
                m.subject_id,
                m.marks,
                e.legacy_id AS legacy_exam_id,
                s.legacy_id AS legacy_subject_id
              FROM marks m
              LEFT JOIN exams e
                ON e.id = m.exam_id
              LEFT JOIN subjects s
                ON s.id = m.subject_id
              INNER JOIN students st
                ON st.id = m.student_id
              INNER JOIN classes c
                ON LOWER(TRIM(c.class_name)) =
                   LOWER(TRIM(st.class_name))
              WHERE m.exam_id = ${databaseExamId}
                AND m.subject_id = ${databaseSubjectId}
                AND c.id = ${numericClassId}
              ORDER BY st.first_name, st.last_name
            `

          return Response.json(
            marks.map(mapMark),
          )
        }

        const marks =
          await sql`
            SELECT
              m.id,
              m.student_id,
              m.exam_id,
              m.subject_id,
              m.marks,
              e.legacy_id AS legacy_exam_id,
              s.legacy_id AS legacy_subject_id
            FROM marks m
            LEFT JOIN exams e
              ON e.id = m.exam_id
            LEFT JOIN subjects s
              ON s.id = m.subject_id
            WHERE m.exam_id = ${databaseExamId}
              AND m.subject_id = ${databaseSubjectId}
            ORDER BY m.id
          `

        return Response.json(
          marks.map(mapMark),
        )
      }

      /*
       * Exam supplied but no subject.
       *
       * This is what we want for the
       * Past Results table.
       */
      if (classId) {
        const numericClassId =
          Number(classId)

        if (
          !Number.isInteger(
            numericClassId,
          )
        ) {
          return Response.json(
            {
              error:
                "Invalid class ID.",
            },
            {
              status: 400,
            },
          )
        }

        const marks =
          await sql`
            SELECT
              m.id,
              m.student_id,
              m.exam_id,
              m.subject_id,
              m.marks,
              e.legacy_id AS legacy_exam_id,
              s.legacy_id AS legacy_subject_id
            FROM marks m
            LEFT JOIN exams e
              ON e.id = m.exam_id
            LEFT JOIN subjects s
              ON s.id = m.subject_id
            INNER JOIN students st
              ON st.id = m.student_id
            INNER JOIN classes c
              ON LOWER(TRIM(c.class_name)) =
                 LOWER(TRIM(st.class_name))
            WHERE m.exam_id = ${databaseExamId}
              AND c.id = ${numericClassId}
            ORDER BY st.first_name, st.last_name
          `

        return Response.json(
          marks.map(mapMark),
        )
      }

      /*
       * Exam only.
       */
      const marks =
        await sql`
          SELECT
            m.id,
            m.student_id,
            m.exam_id,
            m.subject_id,
            m.marks,
            e.legacy_id AS legacy_exam_id,
            s.legacy_id AS legacy_subject_id
          FROM marks m
          LEFT JOIN exams e
            ON e.id = m.exam_id
          LEFT JOIN subjects s
            ON s.id = m.subject_id
          WHERE m.exam_id = ${databaseExamId}
          ORDER BY m.id
        `

      return Response.json(
        marks.map(mapMark),
      )
    }

    /*
     * Backward compatibility:
     *
     * If no examId is supplied, return all marks.
     *
     * This means other parts of the application
     * will not immediately break.
     */
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
      LEFT JOIN exams e
        ON e.id = m.exam_id
      LEFT JOIN subjects s
        ON s.id = m.subject_id
      ORDER BY m.id
    `

    return Response.json(
      marks.map(mapMark),
    )
  } catch (error) {
    console.error(
      "Failed to fetch marks:",
      error,
    )

    return Response.json(
      {
        error:
          "Failed to fetch marks",
      },
      {
        status: 500,
      },
    )
  }
}

/* =========================================================
   POST MARKS
   ========================================================= */

export async function POST(
  request: Request,
) {
  try {
    const user =
      await getCurrentUser()

    if (!user) {
      return Response.json(
        {
          error:
            "You must be logged in to enter marks.",
        },
        {
          status: 401,
        },
      )
    }

    const userId = Number(user.id)

    const userRole = String(
      user.role ?? "",
    ).toLowerCase()

    const isAdmin =
      userRole === "admin"

    let teacherId: number | null =
      null

    if (!isAdmin) {
      if (userRole !== "teacher") {
        return Response.json(
          {
            error:
              "You are not allowed to enter marks.",
          },
          {
            status: 403,
          },
        )
      }

      if (!Number.isInteger(userId)) {
        return Response.json(
          {
            error:
              "Invalid user account.",
          },
          {
            status: 403,
          },
        )
      }

      const linkedTeacherId =
        await getTeacherIdForUser(
          userId,
        )

      if (!linkedTeacherId) {
        return Response.json(
          {
            error:
              "Your account is not linked to a teacher record.",
          },
          {
            status: 403,
          },
        )
      }

      teacherId =
        Number(linkedTeacherId)

      const teacherResult =
        await sql`
          SELECT id, status
          FROM teachers
          WHERE id = ${teacherId}
          LIMIT 1
        `

      const teacher =
        teacherResult[0]

      if (!teacher) {
        return Response.json(
          {
            error:
              "Teacher record not found.",
          },
          {
            status: 403,
          },
        )
      }

      if (
        String(
          teacher.status ?? "",
        ).toLowerCase() !==
        "active"
      ) {
        return Response.json(
          {
            error:
              "Your teacher account is not active.",
          },
          {
            status: 403,
          },
        )
      }
    }

    const body =
      await request.json()

    const examId = String(
      body.examId ?? "",
    )

    /*
     * Accept both:
     *
     * {
     *   entries: [...]
     * }
     *
     * and
     *
     * {
     *   marks: [...]
     * }
     *
     * This makes the API compatible with
     * the Marks page.
     */
    const entries = Array.isArray(
      body.entries,
    )
      ? body.entries
      : Array.isArray(body.marks)
        ? body.marks
        : []

    if (!examId) {
      return Response.json(
        {
          error:
            "Exam ID is required.",
        },
        {
          status: 400,
        },
      )
    }

    if (entries.length === 0) {
      return Response.json(
        {
          error:
            "At least one mark is required.",
        },
        {
          status: 400,
        },
      )
    }

    const databaseExamId =
      await resolveExamId(examId)

    if (
      databaseExamId === null
    ) {
      return Response.json(
        {
          error:
            `Exam not found: ${examId}`,
        },
        {
          status: 404,
        },
      )
    }

    /*
     * Validate everything before writing
     * anything to the database.
     */
    const validatedEntries: Array<{
      studentId: number
      subjectId: number
      score: number
    }> = []

    for (const entry of entries) {
      const studentId =
        String(
          entry.studentId ?? "",
        )

      const subjectId =
        String(
          entry.subjectId ?? "",
        )

      const score = Number(
        entry.score,
      )

      if (
        !studentId ||
        !subjectId ||
        !Number.isFinite(score)
      ) {
        continue
      }

      const databaseStudentId =
        await resolveStudentId(
          studentId,
        )

      const databaseSubjectId =
        await resolveSubjectId(
          subjectId,
        )

      if (
        databaseStudentId === null
      ) {
        return Response.json(
          {
            error:
              `Student not found: ${studentId}`,
          },
          {
            status: 404,
          },
        )
      }

      if (
        databaseSubjectId === null
      ) {
        return Response.json(
          {
            error:
              `Subject not found: ${subjectId}`,
          },
          {
            status: 404,
          },
        )
      }

      if (!isAdmin) {
        const permission =
          await teacherCanEnterMarks(
            teacherId as number,
            databaseStudentId,
            databaseSubjectId,
          )

        if (!permission.allowed) {
          return Response.json(
            {
              error:
                permission.reason,
            },
            {
              status: 403,
            },
          )
        }
      }

      const safeScore =
        Math.max(
          0,
          Math.min(100, score),
        )

      validatedEntries.push({
        studentId:
          databaseStudentId,
        subjectId:
          databaseSubjectId,
        score: safeScore,
      })
    }

    if (
      validatedEntries.length === 0
    ) {
      return Response.json(
        {
          error:
            "No valid marks were supplied.",
        },
        {
          status: 400,
        },
      )
    }

    /*
     * Save marks.
     *
     * Existing marks are updated.
     * New marks are inserted.
     */
    for (const entry of validatedEntries) {
      const existing =
        await sql`
          SELECT id
          FROM marks
          WHERE student_id = ${entry.studentId}
            AND exam_id = ${databaseExamId}
            AND subject_id = ${entry.subjectId}
          LIMIT 1
        `

      if (existing.length > 0) {
        await sql`
          UPDATE marks
          SET marks = ${entry.score}
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
            ${entry.studentId},
            ${databaseExamId},
            ${entry.subjectId},
            ${entry.score}
          )
        `
      }
    }

    return Response.json(
      {
        success: true,
        message:
          "Marks saved successfully.",
        saved:
          validatedEntries.length,
      },
      {
        status: 200,
      },
    )
  } catch (error) {
    console.error(
      "Failed to save marks:",
      error,
    )

    return Response.json(
      {
        error:
          "Failed to save marks.",
      },
      {
        status: 500,
      },
    )
  }
}
