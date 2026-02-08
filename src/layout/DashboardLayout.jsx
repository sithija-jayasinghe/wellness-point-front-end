import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
// import { getUser } from '../auth/authStorage'; // No longer needed

const DashboardLayout = () => {
  // const user = getUser(); // Sidebar now uses context self-contained

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col w-0"> {/* w-0 to prevent flex item growing excessively */}
        <Topbar />
        <main className="flex-1 overflow-y-auto p-5 ml-64 bg-gray-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
