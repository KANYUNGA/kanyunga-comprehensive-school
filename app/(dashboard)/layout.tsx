'use client'

import { CalendarDays } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useSchool } from '@/lib/store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data } = useSchool()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex flex-1 items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Administration Portal</p>
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {data.school.currentTerm} · {data.school.currentYear}
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
