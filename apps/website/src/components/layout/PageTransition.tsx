import React from 'react';

export interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <div className="animate-fadeIn transition-opacity duration-300">
      {children}
    </div>
  );
};
