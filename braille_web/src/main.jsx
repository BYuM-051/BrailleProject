import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AccountProvider } from '@context/AccountContext'
import { SerialProvider } from '@context/SerialContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccountProvider>
      <SerialProvider>
        <App />
      </SerialProvider>
    </AccountProvider>
  </StrictMode>,
)
