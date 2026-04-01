import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GuestProvider } from './context/GuestContext'
import LoginPage from './pages/LoginPage'
import QuestionsPage from './pages/QuestionsPage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  return (
    <BrowserRouter>
      <GuestProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          {/* Catch-all → login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GuestProvider>
    </BrowserRouter>
  )
}
