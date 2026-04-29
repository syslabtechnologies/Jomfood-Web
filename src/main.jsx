import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'react-datepicker/dist/react-datepicker.css'
import './index.css'
import './i18n/config' // Initialize i18n
import App from './App.jsx'
import { initPWAInstallPrompt, registerPWAServiceWorker } from './utils/pwaInstallPrompt'

initPWAInstallPrompt()
registerPWAServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
