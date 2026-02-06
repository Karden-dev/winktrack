import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [order, setOrder] = useState({
    senderPhone: '',
    pickupLocation: null, // { lat: 0, lng: 0 }
    recipientPhone: '',
    price: 0
  });

  const updateOrder = (field, value) => {
    setOrder(prev => ({ ...prev, [field]: value }));
  };

  return (
    <OrderContext.Provider value={{ order, updateOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  return useContext(OrderContext);
}