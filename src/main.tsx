import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Providers } from './components/providers'
import { SkipLink } from './components/accessibility/skip-link'
import { WatsonAssistant } from './components/watson-assistant'
import { VLibrasWidget } from './components/accessibility/vlibras-widget'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Providers>
        <SkipLink />
        <div id="main-content">
          <App />
        </div>
        <WatsonAssistant />
        <VLibrasWidget />
      </Providers>
    </BrowserRouter>
  </React.StrictMode>,
)
