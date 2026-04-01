import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestContext } from '../context/GuestContext'

/**
 * Entry screen — guest types their name to join the game.
 * On success they are redirected to the questions page.
 */
export default function LoginPage() {
  const [name, setName] = useState('')
  const { login, loading, error } = useGuestContext()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await login(name)
      navigate('/questions')
    } catch {
      // error is already surfaced via context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-gray-800">💍 Wedding Game</h1>
          <p className="text-gray-500 text-sm">Enter your name to make your predictions!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          {error && (
            <p className="text-red-500 text-sm">{error.message}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            {loading ? 'Loading…' : "Let's Play!"}
          </button>
        </form>
      </div>
    </div>
  )
}
