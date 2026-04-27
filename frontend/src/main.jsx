import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import useThemeStore from './store/useThemeStore.js'
import { initFirebaseAuthStore } from './store/useFirebaseAuthStore.js'

useThemeStore.getState().initTheme()
// Subscribe to Firebase's auth-state stream so currentUser stays in sync
// across refreshes without re-prompting for credentials.
initFirebaseAuthStore()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
