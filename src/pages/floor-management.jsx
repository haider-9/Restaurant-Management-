import React from 'react';
import { FloorManagementProvider } from '../context/FloorManagementContext';
import FloorCanvas from '../components/FloorCanvas';
import AppSidebar from '../components/AppSidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';


const FloorManagement = () => {
  return (
    <FloorManagementProvider>
        <div className="flex h-screen overflow-hidden font-roboto">
          <FloorCanvas />

          <SidebarTrigger 
            className="fixed top-4 right-4 z-50 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </SidebarTrigger>
          <AppSidebar />
        </div>
    </FloorManagementProvider>
  );
};

export default FloorManagement;
