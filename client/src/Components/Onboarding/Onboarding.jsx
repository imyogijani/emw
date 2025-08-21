import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleSelection from './RoleSelection';
import CustomerOnboarding from './CustomerOnboarding';

const Onboarding = () => {
  return (
    <div className="onboarding-container">
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/customer" element={<CustomerOnboarding />} />
        <Route path="/seller/*" element={<div>Seller Onboarding Coming Soon</div>} />
      </Routes>
    </div>
  );
};

export default Onboarding;