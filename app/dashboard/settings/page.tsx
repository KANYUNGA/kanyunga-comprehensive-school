'use client'

import { useEffect, useState } from 'react'
import { Save, School } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useSchool } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function SettingsPage() {
  const { data, updateSchool } = useSchool()

  const [name, setName] = useState('')
  const [motto, setMotto] = useState('')
  const [poBox, setPoBox] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [currentTerm, setCurrentTerm] = useState('')
  const [currentYear, setCurrentYear] = useState('')

  useEffect(() => {
    setName(data.school.name)
    setMotto(data.school.motto)
    setPoBox(data.school.poBox)
    setEmail(data.school.email)
    setPhone(data.school.phone)
    setCurrentTerm(data.school.currentTerm)
    setCurrentYear(String(data.school.currentYear))
  }, [data.school])

  function handleSave() {
    updateSchool({
      name,
      motto,
      poBox,
      email,
      phone,
      currentTerm,
      currentYear: Number(currentYear),
    })

    alert('School information updated successfully.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your school information and academic settings."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <School className="h-5 w-5" />
            </div>

            <div>
              <CardTitle>School Information</CardTitle>
              <CardDescription>
                Update your school's basic information.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              School Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="motto" className="text-sm font-medium">
              School Motto
            </label>
            <Input
              id="motto"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="poBox" className="text-sm font-medium">
              P.O. Box / Address
            </label>
            <Input
              id="poBox"
              value={poBox}
              onChange={(e) => setPoBox(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="currentTerm" className="text-sm font-medium">
              Current Term
            </label>
            <Input
              id="currentTerm"
              value={currentTerm}
              onChange={(e) => setCurrentTerm(e.target.value)}
              placeholder="e.g. Term 1"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="currentYear" className="text-sm font-medium">
              Current Year
            </label>
            <Input
              id="currentYear"
              type="number"
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
            />
          </div>

          <Button onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
