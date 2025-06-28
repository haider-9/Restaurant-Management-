import React from 'react';
import { FloorManagementProvider } from '../context/FloorManagementContext';
import FloorCanvas from '../components/FloorCanvas';
import Sidebar from '../components/Sidebar';


const FloorManagement = () => {
  return (
    <FloorManagementProvider>
      <div className="flex h-screen bg-gray-100">
        <FloorCanvas />
        <Sidebar />
        
      </div>
    </FloorManagementProvider>
  );
};

export default FloorManagement;
