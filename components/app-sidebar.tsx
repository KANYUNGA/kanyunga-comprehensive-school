'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  PencilRuler,
  Receipt,
  Settings,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useSchool } from '@/lib/store'

type NavItem = { title: string; href: string; icon: typeof LayoutDashboard }
type NavGroup = { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'People',
    items: [
      { title: 'Students', href: '/dashboard/students', icon: Users },
      { title: 'Teachers', href: '/dashboard/teachers', icon: UserCog },
    ],
  },
  {
    label: 'Academics',
    items: [
      { title: 'Classes & Streams', href: '/dashboard/classes', icon: LayoutGrid },
      { title: 'Subjects', href: '/dashboard/subjects', icon: BookOpen },
      { title: 'Examinations', href: '/dashboard/exams', icon: ClipboardList },
      { title: 'Marks Entry', href: '/dashboard/marks', icon: PencilRuler },
      { title: 'Report Forms', href: '/dashboard/reports', icon: FileText },
    ],
  },
  {
    label: 'Attendance',
    items: [
      { title: 'Student Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
      { title: 'Teacher Attendance', href: '/dashboard/teacher-attendance', icon: UserCheck },
    ],
  },
  {
    label: 'Finance',
    items: [
      { title: 'Fees Management', href: '/dashboard/fees', icon: CreditCard },
      { title: 'Payments & Balances', href: '/dashboard/payments', icon: Receipt },
    ],
  },
  {
      label: 'System',
        items: [
                { title: 'Settings', href: '/dashboard/settings', icon: Settings },
                  ],
                  },

]
export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data, logout } = useSchool()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2">
          <Image
            src="/school-crest.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-md bg-sidebar-accent/40 object-contain p-0.5"
          />
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-bold leading-tight text-sidebar-foreground">
              {data.school.name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">{data.school.motto}</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
  render={<Link href={item.href} />}
  isActive={isActive(item.href)}
  tooltip={item.title}
>
  <item.icon />
  <span>{item.title}</span>
</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Administrator</p>
                <p className="truncate text-xs text-sidebar-foreground/60">admin@kanyunga.ac.ke</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                logout()
                router.push('/login')
              }}
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}// refresh
