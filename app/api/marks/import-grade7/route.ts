import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/server-auth"

const sql = getDb()

const EXAM_ID = "exm-1"

const subjects = {
  ENG: "38",
  KISW: "39",
  MATH: "34",
  INTEG: "35",
  "C/A": "41",
  AGRI: "37",
  SST: "42",
  CRE: "40",
  "PRE-TECH": "36",
}

const results = [
  ["125", "Mercy Wanjiku", [71, 68, 36, 64, 70, 70, 68, 72, 74]],
  ["135", "Elizabeth Ntombura", [68, 67, 23, 56, 60, 73, 68, 72, 76]],
  ["122", "Keziah Maina", [78, 73, 48, 58, 70, 81, 0, 70, 80]],
  ["129", "Sharon Nyawira", [68, 75, 58, 66, 61, 74, 0, 70, 84]],
  ["134", "Precious Riziki E", [64, 64, 30, 64, 63, 60, 50, 74, 62]],
  ["157", "Cuties Munene", [61, 48, 33, 54, 66, 68, 56, 64, 60]],
  ["156", "Ryan Musa", [63, 54, 35, 44, 57, 54, 44, 68, 66]],
  ["128", "Mary Naishako", [53, 46, 43, 52, 37, 43, 54, 66, 66]],
  ["159", "Claudia Wamuyu", [58, 45, 27, 42, 37, 65, 41, 66, 74]],
  ["158", "Brian Seketeti", [52, 58, 28, 48, 70, 53, 0, 68, 64]],
  ["121", "Trevor Karani", [57, 24, 45, 36, 31, 44, 58, 60, 74]],
  ["132", "Abigael Nyawira", [60, 52, 15, 28, 47, 47, 58, 58, 62]],
  ["149", "Harriel Wekesa", [51, 50, 30, 44, 33, 58, 39, 62, 56]],
  ["152", "Eunice Wanjiru", [54, 52, 25, 44, 49, 50, 44, 44, 52]],
  ["136", "Praise Mutugi", [63, 72, 51, 52, 47, 54, 0, 70, 0]],
  ["145", "Reward Baraka", [50, 55, 25, 44, 46, 53, 0, 62, 68]],
  ["133", "Shila Mbatai", [71, 67, 28, 34, 49, 43, 0, 64, 46]],
  ["160", "Loreen Mukiri", [44, 43, 28, 14, 41, 56, 35, 66, 58]],
  ["143", "Roseline Diana", [50, 59, 33, 30, 46, 53, 0, 46, 66]],
  ["155", "Evalyne Ntinyari", [44, 54, 20, 34, 36, 48, 35, 64, 46]],
  ["126", "Ayub Murithi", [42, 53, 40, 20, 33, 31, 40, 74, 44]],
  ["130", "Ramsey Karume", [41, 29, 32, 44, 40, 49, 30, 54, 52]],
  ["137", "Ann Mwongera", [47, 63, 20, 30, 40, 47, 26, 56, 0]],
  ["124", "Esther Nyambura", [50, 51, 30, 36, 47, 38, 0, 44, 32]],
  ["141", "Florence Wanjiku", [43, 45, 28, 30, 21, 44, 16, 44, 52]],
  ["140", "Nicholas Mutuma", [42, 51, 20, 32, 30, 43, 0, 32, 30]],
  ["127", "Sharleen Kawira", [37, 27, 30, 24, 17, 36, 21, 34, 44]],
  ["120", "Maxwell Mwirigi", [42, 29, 27, 24, 24, 46, 0, 38, 36]],
  ["142", "Sunday Eliezer", [41, 32, 20, 22, 19, 36, 34, 10, 40]],
  ["154", "Emmicate Wanjogo", [44, 34, 10, 14, 28, 40, 0, 24, 26]],
  ["147", "Victor Murithi", [32, 31, 13, 20, 26, 30, 0, 34, 32]],
  ["151", "Nancy Nakulesha", [29, 33, 8, 20, 20, 30, 20, 26, 26]],
  ["150", "Onesmus Munene", [30, 12, 25, 20, 46, 30, 0, 20, 24]],
  ["122", "Lewis Wambugu", [24, 20, 35, 16, 16, 33, 0, 28, 32]],
  ["139", "Moonshine Gatugi", [34, 43, 23, 14, 21, 43, 0, 22, 0]],
  ["119", "Elosy Kagwiria", [30, 20, 26, 8, 20, 23, 26, 20, 26]],
  ["138", "Vivian Karungari", [28, 17, 20, 16, 12, 10, 15, 10, 34]],
  ["161", "Nemrod Mukaria", [30, 24, 8, 14, 13, 19, 0, 22, 22]],
  ["148", "Glory Wangui", [31, 18, 12, 18, 11, 7, 0, 20, 26]],
  ["146", "Angel Kendi", [23, 28, 13, 14, 10, 11, 0, 18, 14]],
  ["131", "Vincent Gitonga", [18, 0, 0, 0, 0, 30, 38, 0, 0]],
]

const subjectCodes = [
  "ENG",
  "KISW",
  "MATH",
  "INTEG",
  "C/A",
  "AGRI",
  "SST",
  "CRE",
  "PRE-TECH",
]

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

export async function POST() {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    return auth.response
  }

  try {
    const exam = await sql`
      SELECT id, exam_name, term, year
      FROM exams
      WHERE legacy_id = ${EXAM_ID}
         OR id::text = ${EXAM_ID}
      LIMIT 1
    `

    if (!exam.length) {
      return Response.json(
        { success: false, error: "Exam exm-1 was not found" },
        { status: 404 }
      )
    }

    let imported = 0
    let skipped = 0
    const messages: string[] = []

    for (const [admissionNo, studentName, marks] of results) {
      const nameParts = String(studentName)
        .trim()
        .split(/\s+/)

      const firstName = nameParts[0] || ""
      const lastName = nameParts[nameParts.length - 1] || ""

      const students = await sql`
        SELECT id, admission_number, first_name, middle_name, last_name
        FROM students
        WHERE admission_number = ${admissionNo}
          AND LOWER(first_name) = LOWER(${firstName})
          AND LOWER(
            COALESCE(last_name, '')
          ) = LOWER(${lastName})
      `

      if (students.length !== 1) {
        skipped++

        messages.push(
          `${admissionNo} ${studentName}: skipped because ${students.length} matching student records were found`
        )

        continue
      }

      const studentId = students[0].id

      for (let i = 0; i < subjectCodes.length; i++) {
        const subjectCode = subjectCodes[i]
        const score = Number((marks as number[])[i])

        const subject = await sql`
          SELECT id
          FROM subjects
          WHERE subject_code = ${subjects[subjectCode as keyof typeof subjects]}
             OR legacy_id = ${subjects[subjectCode as keyof typeof subjects]}
          LIMIT 1
        `

        if (!subject.length) {
          skipped++
          messages.push(
            `${admissionNo} ${studentName}: subject ${subjectCode} not found`
          )
          continue
        }

        await sql`
          INSERT INTO marks (
            student_id,
            exam_id,
            subject_id,
            marks
          )
          VALUES (
            ${studentId},
            ${exam[0].id},
            ${subject[0].id},
            ${score}
          )
          ON CONFLICT (student_id, exam_id, subject_id)
          DO UPDATE SET
            marks = EXCLUDED.marks
        `

        imported++
      }
    }

    return Response.json({
      success: true,
      exam: {
        id: exam[0].id,
        name: exam[0].exam_name,
        term: exam[0].term,
        year: exam[0].year,
      },
      imported,
      skipped,
      messages,
    })
  } catch (error) {
    console.error("GRADE 7 IMPORT FAILED:", error)

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    )
  }
                        }
