import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { OrderProvider } from './context/OrderContext';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard'; // <--- IMPORT ICI
import MapPage from './pages/MapPage';
import RecipientPage from './pages/RecipientPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';

function App() {
  return (
    <OrderProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} /> {/* <--- ROUTE ICI */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/recipient" element={<RecipientPage />} />
          <Route path="/pay" element={<PaymentPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Routes>
      </Router>
    </OrderProvider>
  );
}

export default App;