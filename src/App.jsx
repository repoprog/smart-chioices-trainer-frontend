import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom';
import useAuthStore from './store/useAuthStore.js';

import { Layout } from './components/layout/Layout.jsx';
import { ToastContainer } from './components/ui/ToastContainer.jsx';
import { DecisionTablePage } from './features/DecisionTable/DecisionTablePage.jsx';
import { DecisionTreePage } from './features/DecisionTree/DecisionTreePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import UserPanel from './pages/UserPanel.jsx';
import Settings from './pages/Settings.jsx';

import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';


import { APP_ROUTES } from './constants/appConstants';

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
 
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
    <ToastContainer />
      <Routes>
        <Route path={APP_ROUTES.HOME} element={<LandingPage />} />
        <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Cały Layout aplikacji */}
        <Route path={APP_ROUTES.APP} element={<Layout />}>
          <Route index element={<Navigate to={APP_ROUTES.TABLE} replace />} />
          
          {/* Publiczne narzędzia */}
          {/* W React Router v6 używanie pełnych ścieżek absolutnych w dzieciach jest w 100% wspierane! */}
          <Route path={APP_ROUTES.TABLE} element={<DecisionTablePage />} /> 
          <Route path={APP_ROUTES.TREE} element={<DecisionTreePage />} />
          
          {/* Prywatne zasoby - chronione */}
          <Route element={<ProtectedRoute />}>
            <Route path={APP_ROUTES.PANEL} element={<UserPanel />} />
            <Route path={APP_ROUTES.SETTINGS} element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={APP_ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;