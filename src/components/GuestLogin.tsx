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
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 flex items-center justify-center p-4 relative">
      {/* Large decorative corner flowers */}
      <div className="fixed top-8 left-8 text-7xl opacity-15 animate-float pointer-events-none hidden sm:block">🌸</div>
      <div className="fixed top-8 right-8 text-6xl opacity-12 animate-float-delayed pointer-events-none hidden sm:block">🌺</div>
      <div className="fixed bottom-8 left-8 text-6xl opacity-12 animate-float-delayed pointer-events-none hidden sm:block">🌿</div>
      <div className="fixed bottom-8 right-8 text-7xl opacity-15 animate-float pointer-events-none hidden sm:block">🌸</div>

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-pastel-pink-200 p-8 w-full max-w-md text-center relative overflow-hidden">
        {/* Decorative flowers with floating animation */}
        <div className="absolute top-2 left-4 text-2xl opacity-60 animate-float">🌸</div>
        <div className="absolute top-4 right-6 text-xl opacity-50 animate-float-delayed">🌿</div>
        <div className="absolute bottom-4 left-8 text-xl opacity-50 animate-float">🌺</div>
        <div className="absolute bottom-2 right-4 text-2xl opacity-60 animate-float-delayed">🌸</div>

        <div className="mb-6 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🌸</span>
            <span className="text-5xl">💍</span>
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mt-3">Pick Your Side of the Aisle</h1>
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
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Enter your name"
              className="w-full border-2 border-pastel-pink-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pastel-pink-400 focus:border-transparent transition"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pastel-pink-400 to-pastel-green-400 hover:from-pastel-pink-500 hover:to-pastel-green-500 text-white font-semibold py-2.5 rounded-lg transition shadow-md relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="group-hover:scale-110 transition-transform">🌺</span>
              Let's Play!
              <span className="group-hover:scale-110 transition-transform">🌺</span>
            </span>
            <span className="absolute top-1 right-4 text-lg opacity-20">✨</span>
            <span className="absolute bottom-1 left-4 text-lg opacity-20">✨</span>
          </button>
        </form>
      </div>
    </div>
  )
}
