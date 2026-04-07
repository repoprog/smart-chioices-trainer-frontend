import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout.jsx'
import { TradeoffModule } from './components/Tradeoff/TradeoffModule.jsx'
import { DecisionTreePage } from './pages/DecisionTreePage.jsx'
import LandingPage from './pages/LandingPage.jsx' // <-- Pamiętaj o tym imporcie!

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Ścieżka główna -> Sam Landing Page (bez Layoutu!) */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Strefa Aplikacji -> Opakowana w Layout z Sidebar-em */}
        <Route path="/app" element={<Layout />}>
          {/* Gdy ktoś wejdzie na gołe /app, od razu rzucamy go do tabeli */}
          <Route index element={<Navigate to="tabela" replace />} />
          <Route path="tabela" element={<TradeoffModule />} />
          <Route path="drzewo" element={<DecisionTreePage />} />
        </Route>

        {/* Opcjonalnie: Łapanie błędnych linków i rzucanie na stronę główną */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App