import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminContext } from '../contexts/AdminContext'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { isAdmin, login } = useAdminContext()
  const navigate = useNavigate()

  // Already logged in — bounce to dashboard
  if (isAdmin) {
    navigate('/admin', { replace: true })
    return null
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const success = login(password)
    if (success) {
      navigate('/admin', { replace: true })
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Enter your admin password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!password}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            Login
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          <Link to="/" className="underline hover:text-gray-600">← Back to guest login</Link>
        </p>
      </div>
    </div>
  )
}
