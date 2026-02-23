import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [order, setOrder] = useState({
    orderId: null,
    // Départ
    pickupLocation: null, // { lat, lng }
    pickupAddress: '',
    // Arrivée
    dropoffLocation: null,
    dropoffAddress: '',
    // Détails
    packageDescription: '',
    recipientName: '',
    recipientPhone: '',
    // Finances & Sécurité
    totalPrice: 0,
    distance: 0,
    otpPickup: null,
    status: 'DRAFT'
  });

  // Fonction polyvalente pour mettre à jour un ou plusieurs champs
  const updateOrder = (field, value) => {
    if (typeof field === 'object') {
        setOrder(prev => ({ ...prev, ...field }));
    } else {
        setOrder(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetOrder = () => setOrder({ orderId: null, pickupLocation: null, status: 'DRAFT' });

  return (
    <OrderContext.Provider value={{ order, updateOrder, resetOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  return useContext(OrderContext);
}