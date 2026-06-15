import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { QueueProvider } from './contexts/QueueContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <QueueProvider>
          <App />
        </QueueProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
