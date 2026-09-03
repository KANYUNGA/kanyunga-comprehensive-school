'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import { GraduationCap, Lock, Mail, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSchool } from '@/lib/store'
import { studentName } from '@/lib/data'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { data, login } = useSchool()
  const [role, setRole] = useState<'admin' | 'teacher' | 'parent'>('admin')
  const [email, setEmail] = useState('admin@kanyunga.ac.ke')
  const [password, setPassword] = useState('password')
  const [studentId, setStudentId] = useState(data.students[0]?.id ?? '')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    if (role === 'admin') {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password
        })
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.message)
        return
      }

      login({
        role: 'admin',
        name: result.user.full_name
      })

      router.push('/dashboard')
    } else {
      const student = data.students.find((s) => s.id === studentId)
      if (!student) {
        setError('Please select a student to continue.')
        return
      }
      login({ role: 'parent', name: student.guardianName, studentId })
      router.push('/parent')
    }
  }

  return (
    <main className="flex min-h-screen bg-background">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <Image src="/school-crest.png" alt="School crest" width={48} height={48} className="h-12 w-12 object-contain" />
          <div>
            <p className="font-heading text-lg font-bold leading-tight">Kanyunga</p>
            <p className="text-sm text-sidebar-foreground/70">Comprehensive School</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-balance font-heading text-4xl font-bold leading-tight">
            School Management System
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-sidebar-foreground/75">
            A secure, all-in-one platform for managing students, teachers, attendance, examinations, and school fees.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-sidebar-foreground/80">
            {[
              'Real-time attendance & performance tracking',
              'Automatic KCSE-style grading & report forms',
              'Fees management with M-Pesa reconciliation',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary/25">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/50">Education for Excellence • Est. 1998</p>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sidebar-primary/20 blur-2xl" />
      </aside>

      {/* Form panel */}
      <section className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Image src="/school-crest.png" alt="School crest" width={56} height={56} className="h-14 w-14 object-contain" />
            <h2 className="mt-3 font-heading text-xl font-bold">Kanyunga Comprehensive School</h2>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to access your portal.</p>
          </div>

          {/* Role selector */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setRole('admin')
                setEmail('admin@kanyunga.ac.ke')
                setError('')
              }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                role === 'admin' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ShieldCheck className="h-4 w-4" /> Administrator
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('teacher')
        setEmail('teacher1@kanyunga.school')
        setError('')
      }}
    >
      Teacher
    </button>

    <button
      type="button"
      onClick={() => {
        setRole('parent')
                setEmail('parent@example.com')
                setError('')
              }}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                role === 'parent' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Users className="h-4 w-4" /> Parent
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {role === 'parent' && (
              <div className="space-y-2">
                <Label htmlFor="student">Select your child (demo)</Label>
                <select
                  id="student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {data.students.slice(0, 40).map((s) => (
                    <option key={s.id} value={s.id}>
                      {studentName(s)} — {s.admissionNo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full">
              <GraduationCap className="h-4 w-4" /> Sign in
            </Button>
          </form>

          <p className="mt-6 rounded-lg border border-border bg-muted/50 p-3 text-center text-xs text-muted-foreground">
            Demo credentials are pre-filled. Just click <span className="font-medium text-foreground">Sign in</span>.
          </p>
        </div>
      </section>
    </main>
  )
}
