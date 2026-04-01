import { useState } from 'react'

interface GuestLoginProps {
  onLogin: (name: string) => void
}

export default function GuestLogin({ onLogin }: GuestLoginProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name to continue.')
      return
    }
    onLogin(trimmed)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <span className="text-5xl">💍</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-3">Wedding Gambling Game</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Make your predictions and see how they stack up against other guests!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Enter your name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Let's Play!
          </button>
        </form>
      </div>
    </div>
  )
}
