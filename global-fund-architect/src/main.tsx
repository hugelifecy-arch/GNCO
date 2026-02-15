import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import 'reactflow/dist/style.css'

try {
  const params = new URLSearchParams(window.location.search)
  const p = params.get('p')
  if (p) {
    const decoded = decodeURIComponent(p)
    const base = '/GNCO/'
    const next = base + decoded.replace(/^\/+/, '')
    window.history.replaceState(null, '', next)
  }
} catch {
  // no-op
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
