use client'

import { useState } from 'react'
import { Save, School, Settings } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
const [schoolName, setSchoolName] = useState('Kanyunga Comprehensive School')
const [email, setEmail] = useState('')
const [phone, setPhone] = useState('')
const [address, setAddress] = useState('')

function handleSave() {
alert('School information saved successfully.')
}

return ( <div className="space-y-6"> <PageHeader
     title="Settings"
     description="Manage your school management system settings."
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
        <Label htmlFor="schoolName">School Name</Label>
        <Input
          id="schoolName"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          placeholder="Enter school name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="school@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address / Location</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter school address or location"
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
