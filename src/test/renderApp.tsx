import { render } from '@testing-library/react'
import App from '../App'

/**
 * Renders the full App (which owns its own BrowserRouter).
 * Use this for end-to-end flow tests.
 * Use renderWithProviders for isolated component/page tests.
 */
export function renderApp(initialPath = '/') {
  window.history.pushState({}, '', initialPath)
  return render(<App />)
}
