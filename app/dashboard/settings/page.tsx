'use client'\nimport { useSchool } from '@/lib/store'\nimport { useRouter } from 'next/navigation'\nimport { useEffect } from 'react'\n\nexport const dynamic = "force-dynamic"
import { revalidatePath } from 'next/cache'
import { getDb } from "@/lib/db"

const sql = getDb()

async function getSchoolSettings() {
  const result = await sql`
    SELECT
      "Id" AS id,
      "School name" AS school_name,
      "School code" AS school_code,
      "Address" AS address,
      "Postal code" AS postal_code,
      "Town" AS town,
      "Phone" AS phone,
      "Email" AS email,
      "Motto" AS motto,
      "Logo url" AS logo_url
    FROM "School settings"
    ORDER BY "Id"
    LIMIT 1
  `

  return result[0]
}

async function updateSchoolSettings(formData: FormData) {
  'use server'

  const id = formData.get('id')?.toString()

  if (!id) {
    throw new Error('School settings record was not found')
  }

  const schoolName = formData.get('schoolName')?.toString() ?? ''
  const schoolCode = formData.get('schoolCode')?.toString() ?? ''
  const address = formData.get('address')?.toString() ?? ''
  const postalCode = formData.get('postalCode')?.toString() ?? ''
  const town = formData.get('town')?.toString() ?? ''
  const phone = formData.get('phone')?.toString() ?? ''
  const email = formData.get('email')?.toString() ?? ''
  const motto = formData.get('motto')?.toString() ?? ''
  const logoUrl = formData.get('logoUrl')?.toString() ?? ''

  await sql`
    UPDATE "School settings"
    SET
      "School name" = ${schoolName},
      "School code" = ${schoolCode},
      "Address" = ${address},
      "Postal code" = ${postalCode},
      "Town" = ${town},
      "Phone" = ${phone},
      "Email" = ${email},
      "Motto" = ${motto},
      "Logo url" = ${logoUrl},
      "Updated at" = NOW()
    WHERE "Id" = ${id}
  `

  revalidatePath('/dashboard/settings')
}

export default async function SettingsPage() {
  const school = await getSchoolSettings()

  if (!school) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">School Settings</h1>
        <p className="text-muted-foreground">
          No school settings record was found in the database.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">School Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your school information stored in Neon.
        </p>
      </div>

      <form action={updateSchoolSettings} className="space-y-6">
        <input type="hidden" name="id" value={String(school.id)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="schoolName" className="text-sm font-medium">
              School Name
            </label>
            <input
              id="schoolName"
              name="schoolName"
              defaultValue={school.school_name ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="schoolCode" className="text-sm font-medium">
              School Code
            </label>
            <input
              id="schoolCode"
              name="schoolCode"
              defaultValue={school.school_code ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={school.phone ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="address" className="text-sm font-medium">
              Address
            </label>
            <input
              id="address"
              name="address"
              defaultValue={school.address ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="postalCode" className="text-sm font-medium">
              Postal Code
            </label>
            <input
              id="postalCode"
              name="postalCode"
              defaultValue={school.postal_code ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="town" className="text-sm font-medium">
              Town
            </label>
            <input
              id="town"
              name="town"
              defaultValue={school.town ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={school.email ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="motto" className="text-sm font-medium">
              Motto
            </label>
            <input
              id="motto"
              name="motto"
              defaultValue={school.motto ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="logoUrl" className="text-sm font-medium">
              Logo URL
            </label>
            <input
              id="logoUrl"
              name="logoUrl"
              defaultValue={school.logo_url ?? ''}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Save School Settings
        </button>
      </form>
    </div>
  )
}
