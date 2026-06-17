import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter as Router } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import CookieConsent from '@/components/CookieConsent'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <CookieConsent />
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  </ErrorBoundary>
)
