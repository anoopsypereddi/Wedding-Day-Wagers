import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminContext } from '../contexts/AdminContext'
import logo from '../assets/logo.png'

const navLinks = [
  { to: '/admin', label: 'Overview', icon: '📊', end: true },
  { to: '/admin/questions', label: 'Questions', icon: '❓', end: false },
  { to: '/admin/game', label: 'Game Control', icon: '🎲', end: false },
  { to: '/admin/submissions', label: 'Submissions', icon: '📋', end: false },
  { to: '/admin/leaderboard', label: 'Leaderboard', icon: '🏆', end: false },
]

export default function AdminDashboard() {
  const { logout } = useAdminContext()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 bg-white shadow-sm flex-col shrink-0">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8 object-contain shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-0.5">Wedding Game</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <span>👥</span>
            Guest View
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-6 w-6 object-contain shrink-0" />
          <h1 className="text-base font-bold text-gray-800">Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Guest View
          </NavLink>
          <button
            onClick={handleLogout}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-10">
        {navLinks.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-rose-600' : 'text-gray-400'
              }`
            }
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="leading-none">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
