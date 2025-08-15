import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './AuthTransition.css';

const AuthTransition = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionClass, setTransitionClass] = useState('');

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);
      
      // Determine transition direction
      const isGoingToRegister = location.pathname === '/register';
      const isGoingToLogin = location.pathname === '/login';
      
      if (isGoingToRegister) {
        setTransitionClass('slide-out-left');
      } else if (isGoingToLogin) {
        setTransitionClass('slide-out-right');
      }
      
      // Start exit animation
      setTimeout(() => {
        setDisplayLocation(location);
        if (isGoingToRegister) {
          setTransitionClass('slide-in-right');
        } else if (isGoingToLogin) {
          setTransitionClass('slide-in-left');
        }
      }, 300);
      
      // Complete transition
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionClass('');
      }, 600);
    }
  }, [location, displayLocation]);

  return (
    <div className={`auth-transition-container ${transitionClass} ${isTransitioning ? 'transitioning' : ''}`}>
      {children}
    </div>
  );
};

export default AuthTransition;