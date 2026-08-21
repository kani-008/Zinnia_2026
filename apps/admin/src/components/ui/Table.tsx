import React from 'react';

export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto font-mono text-xs">
    <table className="w-full text-left">{children}</table>
  </div>
);
