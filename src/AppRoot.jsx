import React from 'react'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './lib/i18n.jsx'
import { installGlobalErrorLogging } from './lib/telemetry'

installGlobalErrorLogging()

export default function AppRoot() {
  return (
    <React.StrictMode>
      <LanguageProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </LanguageProvider>
    </React.StrictMode>
  )
}
