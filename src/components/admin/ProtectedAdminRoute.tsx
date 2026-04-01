import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminContext } from '../../contexts/AdminContext'

export default function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAdminContext()
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />
}
