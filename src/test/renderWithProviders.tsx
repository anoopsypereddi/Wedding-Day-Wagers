import { render } from '@testing-library/react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { GuestProvider } from '../context/GuestContext'
import { AdminProvider } from '../contexts/AdminContext'
import type { ReactNode } from 'react'

interface Options {
  routerProps?: MemoryRouterProps
}

export function renderWithProviders(ui: ReactNode, { routerProps }: Options = {}) {
  return render(
    <MemoryRouter {...routerProps}>
      <AdminProvider>
        <GuestProvider>{ui}</GuestProvider>
      </AdminProvider>
    </MemoryRouter>
  )
}
