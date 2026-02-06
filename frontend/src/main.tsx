import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { ResourceProvider } from './context/ResourceContext'
import { ToggleProvider } from './context/ToggleContext'
import { AuditLogProvider } from './context/AuditLogContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ResourceProvider>
        <ToggleProvider>
          <AuditLogProvider>
            <App />
          </AuditLogProvider>
        </ToggleProvider>
      </ResourceProvider>
    </AuthProvider>
  </StrictMode>,
)
