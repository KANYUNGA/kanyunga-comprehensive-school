import AddUserForm from '@/components/AddUserForm'
import { getDb } from '@/lib/db'

export default async function UsersPage() {
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
                                                                                                                                                                                                                                                                                   