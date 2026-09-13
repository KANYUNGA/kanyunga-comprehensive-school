import { getDb } from '@/lib/db'
import AddUserForm from '@/components/AddUserForm'
import ResetPasswordForm from '@/components/ResetPasswordForm'
import { requireAdmin } from '@/lib/server-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const auth = await requireAdmin()

  if (!auth.authorized) {
    redirect('/login')
  }

  const sql = getDb()

  const users = await sql`
    SELECT id, username, full_name, email, role, status
    FROM users
    ORDER BY id
  `

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      <div className="mb-8">
        <AddUserForm />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">ID</th>
              <th className="p-2 border text-left">Username</th>
              <th className="p-2 border text-left">Full Name</th>
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-left">Role</th>
              <th className="p-2 border text-left">Status</th>
              <th className="p-2 border text-left">Password</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user: any) => (
              <tr key={user.id}>
                <td className="p-2 border">{user.id}</td>
                <td className="p-2 border">{user.username}</td>
                <td className="p-2 border">{user.full_name}</td>
                <td className="p-2 border">{user.email}</td>
                <td className="p-2 border">{user.role}</td>
                <td className="p-2 border">{user.status}</td>
                <td className="p-2 border">
                  <ResetPasswordForm
                    userId={user.id}
                    userName={user.full_name}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
