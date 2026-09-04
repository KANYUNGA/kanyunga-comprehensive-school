'use client'

import { useSchool } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'



export const dynamic = 'force-dynamic'
import AddUserForm from '@/components/AddUserForm'
import { getDb } from '@/lib/db'

export default function UsersPage() {
  const { auth } = useSchool()
  const router = useRouter()

  useEffect(() => {
    if (auth && auth.role !== 'Admin') {
      router.push('/dashboard')
    }
  }, [auth, router])

  if (!auth || auth.role !== 'Admin') {
    return <div className="p-6 text-red-600 font-medium">Access Denied. Admins only.</div>
  }
 {
  const sql = getDb()

    const users = await sql`
        SELECT id, username, full_name, role, status
            FROM users
                ORDER BY id
                  `

                    return (
                        <div className="p-6">
                              <h1 className="text-2xl font-bold mb-4">User Management</h1>
                              <AddUserForm />

                                    <table className="w-full border">
                                            <thead>
                                                      <tr>
                                                                  <th>ID</th>
                                                                              <th>Username</th>
                                                                                          <th>Full Name</th>
                                                                                                      <th>Role</th>
                                                                                                                  <th>Status</th>
                                                                                                                            </tr>
                                                                                                                                    </thead>
                                                                                                                                            <tbody>
                                                                                                                                                      {users.map((user: any) => (
                                                                                                                                                                  <tr key={user.id}>
                                                                                                                                                                                <td>{user.id}</td>
                                                                                                                                                                                              <td>{user.username}</td>
                                                                                                                                                                                                            <td>{user.full_name}</td>
                                                                                                                                                                                                                          <td>{user.role}</td>
                                                                                                                                                                                                                                        <td>{user.status}</td>
                                                                                                                                                                                                                                                    </tr>
                                                                                                                                                                                                                                                              ))}
                                                                                                                                                                                                                                                                      </tbody>
                                                                                                                                                                                                                                                                            </table>
                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                  )
                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                   