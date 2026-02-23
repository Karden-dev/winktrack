// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { OrderProvider } from './context/OrderContext';

// --- 1. PAGES CLIENT (EXPÉDITEUR) ---
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import RecipientPage from './pages/RecipientPage';
import ConfirmDestination from './pages/ConfirmDestination';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import Dashboard from './pages/dashboard/Dashboard';

// --- 2. AUTHENTIFICATION ---
import RiderLogin from './pages/auth/RiderLogin';
import RiderRegister from './pages/auth/RiderRegister';
import AdminLogin from './pages/auth/AdminLogin';

// --- 3. PAGES LIVREUR (RIDER APP) ---
import RiderLayout from './components/layouts/RiderLayout';
import RadarPage from './pages/rider/RadarPage';
import MissionsPage from './pages/rider/MissionsPage';
import WalletPage from './pages/rider/WalletPage';
import ProfilePage from './pages/rider/ProfilePage';

// --- 4. PAGES ADMIN (BACK-OFFICE) ---
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminRidersPage from './pages/admin/AdminRidersPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import AdminZonesPage from './pages/admin/AdminZonesPage';
import AdminPricingPage from './pages/admin/AdminPricingPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

/**
 * COMPOSANT DE PROTECTION DES ROUTES ADMIN
 * Vérifie le token et le rôle stockés dans le localStorage
 */
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('wink_token');
  const userRole = localStorage.getItem('wink_user_role'); 

  if (!token || userRole !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <OrderProvider>
      <Router>
        <Routes>
          
          {/* ====================================================
              1. UNIVERS CLIENT
          ==================================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/recipient" element={<RecipientPage />} />
          <Route path="/confirm-destination/:token" element={<ConfirmDestination />} />
          <Route path="/pay" element={<PaymentPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/dashboard/*" element={<Dashboard />} />

          {/* ====================================================
              2. AUTHENTIFICATION
          ==================================================== */}
          <Route path="/rider/login" element={<RiderLogin />} />
          <Route path="/rider/register" element={<RiderRegister />} /> {/* ✅ Route synchronisée avec RiderLogin */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ====================================================
              3. UNIVERS LIVREUR (Protégé par RiderLayout)
          ==================================================== */}
          <Route path="/rider" element={<RiderLayout />}>
            <Route index element={<Navigate to="/rider/radar" replace />} />
            <Route path="radar" element={<RadarPage />} />
            <Route path="missions" element={<MissionsPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ====================================================
              4. UNIVERS ADMIN (Sécurisé par ProtectedAdminRoute)
          ==================================================== */}
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="riders" element={<AdminRidersPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="finance" element={<AdminFinancePage />} />
            <Route path="zones" element={<AdminZonesPage />} />
            <Route path="pricing" element={<AdminPricingPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Redirection par défaut vers l'accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </OrderProvider>
  );
}

export default App;