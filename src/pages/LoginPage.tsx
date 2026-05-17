import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestContext } from '../context/GuestContext'

/**
 * Entry screen — guest types their name to join the game.
 */
export default function LoginPage() {
  const [name, setName] = useState('')
  const { login, loading, error } = useGuestContext()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await login(name)
      navigate('/game')
    } catch {
      // error is already surfaced via context
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-pastel-pink-200 p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="mb-2">
            <span className="text-5xl">💍</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mt-3">Wedding Wagers</h1>
          <p className="text-gray-600 mt-2 text-sm">
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
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={loading}
              className="w-full border-2 border-pastel-pink-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pastel-pink-400 focus:border-transparent transition"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-gradient-to-r from-pastel-pink-400 to-pastel-green-400 hover:from-pastel-pink-500 hover:to-pastel-green-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition shadow-md"
          >
            {loading ? 'Loading…' : "Let's Play!"}
          </button>
        </form>
      </div>
    </div>
  )
}
