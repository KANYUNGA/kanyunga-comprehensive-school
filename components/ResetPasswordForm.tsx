'use client'

import { useState } from 'react'

type Props = {
  userId: number
  userName: string
}

export default function ResetPasswordForm({ userId, userName }: Props) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function resetPassword() {
    if (!password) {
      alert('Enter a new password')
      return
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    const confirmed = window.confirm(
      `Reset the password for ${userName}?`
    )

    if (!confirmed) return

    setLoading(true)

    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Failed to reset password')
        return
      }

      alert('Password reset successfully')
      setPassword('')
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 min-w-[260px]">
      <input
        type="password"
        placeholder="New password"
        className="border rounded p-2 w-full"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button
        type="button"
        onClick={resetPassword}
        disabled={loading}
        className="bg-red-600 text-white px-3 py-2 rounded whitespace-nowrap disabled:opacity-50"
      >
        {loading ? 'Resetting...' : 'Reset'}
      </button>
    </div>
  )
}
