import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout.jsx'
import { DecisionTablePage } from './pages/DecisionTablePage.jsx'
import { DecisionTreePage } from './pages/DecisionTreePage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/tabela" replace />} />
          <Route path="tabela" element={<DecisionTablePage />} />
          <Route path="drzewo" element={<DecisionTreePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
