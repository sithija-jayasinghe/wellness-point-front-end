import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell } from 'lucide-react';
import { clearAuth } from '../auth/authStorage';
import Button from '../components/Button';

const Topbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="h-16 flex justify-between items-center bg-white border-b border-gray-200 px-5 z-40 ml-64">
      <div className="flex-1 w-full">
         {/* Search or breadcrumbs could go here */}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                <User className="h-5 w-5" />
            </div>
            <div className="hidden md:block text-sm text-right">
                <p className="font-medium text-gray-700">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Staff'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
