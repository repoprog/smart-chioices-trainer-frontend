import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout.jsx'
import { TradeoffModule } from './components/Tradeoff/TradeoffModule.jsx' // Zostawiamy działającą logikę!
import { DecisionTreePage } from './pages/DecisionTreePage.jsx' // Zostawiamy działającą logikę!
import LandingPage from './pages/LandingPage.jsx'
import UserPanel from './pages/UserPanel.jsx' // Nowy plik od Ciebie
import Settings from './pages/Settings.jsx' // Nowy plik od Ciebie

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="tabela" replace />} />
          {/* Używamy starej, prawdziwej tabeli */}
          <Route path="tabela" element={<TradeoffModule />} /> 
          {/* Używamy starego, prawdziwego drzewa */}
          <Route path="drzewo" element={<DecisionTreePage />} />
          {/* Nowe strony z UI */}
          <Route path="panel" element={<UserPanel />} />
          <Route path="ustawienia" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App