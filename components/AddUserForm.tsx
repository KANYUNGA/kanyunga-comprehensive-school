'use client'

import { useState } from 'react'

export default function AddUserForm() {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'Teacher'
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    })

    if (res.ok) {
      alert('User created')
      location.reload()
    } else {
      alert('Failed to create user')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 mb-6">
      <input
        placeholder="Username"
        className="border p-2 w-full"
        value={form.username}
        onChange={e => setForm({...form, username: e.target.value})}
      />

      <input
        placeholder="Full Name"
        className="border p-2 w-full"
        value={form.full_name}
        onChange={e => setForm({...form, full_name: e.target.value})}
      />

      <input
        placeholder="Email"
        className="border p-2 w-full"
        value={form.email}
        onChange={e => setForm({...form, email: e.target.value})}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 w-full"
        value={form.password}
        onChange={e => setForm({...form, password: e.target.value})}
      />

      <select
        className="border p-2 w-full"
        value={form.role}
        onChange={e => setForm({...form, role: e.target.value})}
      >
        <option>Teacher</option>
        <option>Admin</option>
      </select>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add User
      </button>
    </form>
  )
}
