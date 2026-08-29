'use client'

import { Settings } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
return ( <div className="space-y-6"> <PageHeader
     title="Settings"
     description="Manage your school management system settings."
   />


  <Card>
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure and manage your school system preferences.
          </CardDescription>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <p className="text-sm text-muted-foreground">
        Settings for the Kanyunga Comprehensive School Management System
        will appear here.
      </p>
    </CardContent>
  </Card>
</div>


)
}
