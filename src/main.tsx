import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Providers } from './components/providers'
import { SkipLink } from './components/accessibility/skip-link'
import { ScrollToTop } from './components/navigation/scroll-to-top'
import { WatsonAssistant } from './components/watson-assistant'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Providers>
        <SkipLink />
        <div id="main-content">
          <App />
        </div>
        <WatsonAssistant />
      </Providers>
    </BrowserRouter>
  </React.StrictMode>,
)
