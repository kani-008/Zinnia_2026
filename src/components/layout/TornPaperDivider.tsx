import React from 'react';

export const TornPaperDivider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`torn-paper ${className}`} aria-hidden="true">
      {/* Loose Paper Fibers */}
      <span className="fiber left" />
      <span className="fiber center" />
      <span className="fiber right" />
      <span className="fiber flap" />

      {/* Small Paper Specks */}
      <span className="speck a" />
      <span className="speck b" />
      <span className="speck c" />
      <span className="speck d" />
    </div>
  );
};

export default TornPaperDivider;
