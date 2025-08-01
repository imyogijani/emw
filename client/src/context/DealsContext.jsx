import React, { createContext, useContext, useState } from 'react';

const DealsContext = createContext();

const initialDeals = [
  { id: 1, title: '50% Off Pizza', description: 'Get 50% off on all pizzas!', discount: 50, sellerId: 1, status: 'approved' },
  { id: 2, title: 'Buy 1 Get 1 Free Burger', description: 'Order any burger and get another free!', discount: 100, sellerId: 2, status: 'pending' },
  { id: 3, title: '20% Off All Drinks', description: 'Enjoy 20% off on all beverages.', discount: 20, sellerId: 1, status: 'rejected' },
  { id: 4, title: 'Free Dessert', description: 'Get a free dessert with every main course.', discount: 100, sellerId: 3, status: 'approved' },
];

export function DealsProvider({ children }) {
  const [deals, setDeals] = useState(initialDeals);

  // Add a new deal (from seller)
  const addDeal = (deal) => {
    setDeals(prev => [
      ...prev,
      { ...deal, id: Date.now(), status: 'pending' }
    ]);
  };

  // Update a deal (from seller, only if pending/rejected)
  const updateDeal = (updatedDeal) => {
    setDeals(prev => prev.map(d => d.id === updatedDeal.id ? { ...d, ...updatedDeal } : d));
  };

  // Delete a deal (from seller, only if pending/rejected)
  const deleteDeal = (id) => {
    setDeals(prev => prev.filter(d => d.id !== id));
  };

  // Approve a deal (from admin)
  const approveDeal = (id) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d));
  };

  // Reject a deal (from admin)
  const rejectDeal = (id) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
  };

  return (
    <DealsContext.Provider value={{ deals, addDeal, updateDeal, deleteDeal, approveDeal, rejectDeal }}>
      {children}
    </DealsContext.Provider>
  );
}

export function useDeals() {
  return useContext(DealsContext);
} 