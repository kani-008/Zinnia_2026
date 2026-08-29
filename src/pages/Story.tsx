import React from 'react';
import { Navigate } from 'react-router-dom';

export const WebsiteStoryPage: React.FC = () => {
  return <Navigate to="/" replace />;
};

export default WebsiteStoryPage;
