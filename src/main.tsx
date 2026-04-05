import React from 'react'
import ReactDOM from 'react-dom/client'
import clarity from '@microsoft/clarity'
import App from './App'
import './styles/globals.css'

// Initialize Microsoft Clarity
clarity.init('w71wgp44fk')

// Initialize dataLayer for GTM
window.dataLayer = window.dataLayer || []

// Track page load time for behavioral analytics
;(window as any).__pageLoadTime = Date.now()

// Track visit count
try {
  const vc = parseInt(localStorage.getItem('zippy_visit_count') || '0', 10)
  localStorage.setItem('zippy_visit_count', String(vc + 1))
} catch { /* silent */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
