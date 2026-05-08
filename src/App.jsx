import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom'
import useAuthStore from './store/useAuthStore.js'

import { Layout } from './components/layout/Layout.jsx'
import { DecisionTablePage } from './features/DecisionTable/DecisionTablePage.jsx'
import { DecisionTreePage } from './features/DecisionTree/DecisionTreePage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import UserPanel from './pages/UserPanel.jsx'
import Settings from './pages/Settings.jsx'

import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Cały Layout aplikacji */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="table" replace />} />
          
          {/* Publiczne narzędzia */}
          <Route path="table" element={<DecisionTablePage />} /> 
          <Route path="tree" element={<DecisionTreePage />} />
          
          {/* Prywatne zasoby - chronione */}
          <Route element={<ProtectedRoute />}>
            <Route path="panel" element={<UserPanel />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App