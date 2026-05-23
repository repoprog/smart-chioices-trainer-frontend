import { useEffect } from 'react'; 

import { BrowserRouter, Navigate, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from './store/useAuthStore.js';

import { Layout } from './components/layout/Layout.jsx';
import { ToastContainer } from './components/ui/ToastContainer.jsx';
import { DecisionTablePage } from './features/DecisionTable/DecisionTablePage.jsx';
import { DecisionTreePage } from './features/DecisionTree/DecisionTreePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import UserPanel from './pages/UserPanel.jsx';
import Settings from './pages/Settings.jsx';

// DODANE: Import nowej strony udostępnionego projektu
import { SharedProjectPage } from './pages/SharedProjectPage.jsx'; 

// DODANE: Import globalnych Modali autoryzacji (upewnij się, że ścieżki się zgadzają z Twoją strukturą!)
import { LoginModal } from './auth/LoginModal.jsx'; 
import { RegisterModal } from './auth/RegisterModal.jsx';

import { APP_ROUTES } from './constants/appConstants';

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const setPendingRedirectPath = useAuthStore((state) => state.setPendingRedirectPath);
  const location = useLocation();

  // useEffect musi być na najwyższym poziomie komponentu
  useEffect(() => {
    if (!isAuthenticated) {
      setPendingRedirectPath(location.pathname); // Zapamiętujemy, gdzie chciał wejść
      openLoginModal(); // Wywołujemy modal
    }
  }, [isAuthenticated, location.pathname, openLoginModal, setPendingRedirectPath]);
  
  if (!isAuthenticated) {
    // Ponieważ usunęliśmy stronę /login, przekierowujemy na Landing Page
    return <Navigate to={APP_ROUTES.HOME} replace />;
  }
  
  return <Outlet />;
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  // DODANE: Wyciągamy stany i akcje modali z globalnego store'a
  const { 
    isLoginModalOpen, 
    isRegisterModalOpen, 
    closeAuthModals, 
    openRegisterModal, 
    openLoginModal 
  } = useAuthStore();

  // Odpalenie fetchProfile po odświeżeniu, jeśli user jest zalogowany
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path={APP_ROUTES.HOME} element={<LandingPage />} />
        
        {/* USUNIĘTE trasy do /login i /register */}

        {/* Trasa publiczna dla linków udostępniania (musi być poza ProtectedRoute) */}
        <Route path="/shared/:token" element={<SharedProjectPage />} />

        {/* Cały Layout aplikacji */}
        <Route path={APP_ROUTES.APP} element={<Layout />}>
          <Route index element={<Navigate to={APP_ROUTES.TABLE} replace />} />
          
          {/* Publiczne narzędzia */}
          <Route path={APP_ROUTES.TABLE} element={<DecisionTablePage />} /> 
          <Route path={APP_ROUTES.TREE} element={<DecisionTreePage />} />
          
          {/* Prywatne zasoby - chronione */}
          <Route element={<ProtectedRoute />}>
            <Route path={APP_ROUTES.PANEL} element={<UserPanel />} />
            <Route path={APP_ROUTES.SETTINGS} element={<Settings />} />
          </Route>
        </Route>

        {/* CATCH-ALL: Jeśli ścieżka nie istnieje (i nie jest to /shared/:token), wróć na główną */}
        <Route path="*" element={<Navigate to={APP_ROUTES.HOME} replace />} />
      </Routes>

      {/* DODANE: Globalne Modale zamontowane poza systemem Route'ów */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeAuthModals} 
        onSwitchToRegister={openRegisterModal} 
      />
      
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={closeAuthModals} 
        onSwitchToLogin={openLoginModal} 
      />
    </BrowserRouter>
  )
}

export default App;