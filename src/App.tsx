import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GuestProvider } from './context/GuestContext'
import { AdminProvider } from './contexts/AdminContext'
import LoginPage from './pages/LoginPage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import AdminOverview from './components/admin/AdminOverview'
import QuestionManager from './components/admin/QuestionManager'
import SubmissionsView from './components/admin/SubmissionsView'
import GameControl from './components/admin/GameControl'
import Leaderboard from './components/admin/Leaderboard'

export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <GuestProvider>
          <Routes>
            {/* Guest routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/questions" element={<Navigate to="/game" replace />} />
            <Route path="/results" element={<Navigate to="/game" replace />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="questions" element={<QuestionManager />} />
              <Route path="submissions" element={<SubmissionsView />} />
              <Route path="game" element={<GameControl />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              {/* Legacy admin route redirects */}
              <Route path="answers" element={<Navigate to="/admin/game" replace />} />
              <Route path="lock" element={<Navigate to="/admin/game" replace />} />
            </Route>

            {/* Catch-all → login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GuestProvider>
      </AdminProvider>
    </BrowserRouter>
  )
}
