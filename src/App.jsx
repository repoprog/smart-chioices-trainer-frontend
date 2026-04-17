import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/layout/Layout.jsx'
import { DecisionTablePage } from './features/DecisionTable/DecisionTablePage.jsx'
import { DecisionTreePage } from './features/DecisionTree/DecisionTreePage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import UserPanel from './pages/UserPanel.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="table" replace />} />
         
          <Route path="table" element={<DecisionTablePage />} /> 
         
          <Route path="tree" element={<DecisionTreePage />} />
          
        
          <Route path="panel" element={<UserPanel />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App