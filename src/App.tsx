import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GuestProvider } from './context/GuestContext'
import { AdminProvider } from './contexts/AdminContext'
import LoginPage from './pages/LoginPage'
import QuestionsPage from './pages/QuestionsPage'
import ResultsPage from './pages/ResultsPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import AdminOverview from './components/admin/AdminOverview'
import QuestionManager from './components/admin/QuestionManager'
import SubmissionsView from './components/admin/SubmissionsView'
import MarkAnswers from './components/admin/MarkAnswers'
import Leaderboard from './components/admin/Leaderboard'
import LockControl from './components/admin/LockControl'

export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <GuestProvider>
          <Routes>
            {/* Guest routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/results" element={<ResultsPage />} />

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
              <Route path="answers" element={<MarkAnswers />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="lock" element={<LockControl />} />
            </Route>

            {/* Catch-all → login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GuestProvider>
      </AdminProvider>
    </BrowserRouter>
  )
}
