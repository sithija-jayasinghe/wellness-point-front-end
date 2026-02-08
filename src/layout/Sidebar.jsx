import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Stethoscope, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  CreditCard, 
  RotateCcw, 
  Bell, 
  UserCog, 
  Shield,  
  Key,
  PlusSquare
} from 'lucide-react';
import { cn } from '../utils';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const userRole = user?.role;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT', 'STAFF'] },
    { icon: Building2, label: 'Clinics', path: '/clinics', roles: ['ADMIN', 'RECEPTIONIST', 'STAFF'] },
    { icon: Stethoscope, label: 'Doctors', path: '/doctors', roles: ['ADMIN', 'RECEPTIONIST', 'STAFF', 'PATIENT'] },
    { icon: Users, label: 'Patients', path: '/patients', roles: ['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR'] },
    { icon: Calendar, label: 'Schedules', path: '/schedules', roles: ['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR'] },
    { icon: Clock, label: 'Appointments', path: '/appointments', roles: ['ADMIN', 'RECEPTIONIST', 'STAFF', 'DOCTOR', 'PATIENT'] },
    { icon: FileText, label: 'Consultations', path: '/consultations', roles: ['ADMIN', 'DOCTOR'] },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions', roles: ['ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST', 'STAFF'] },
    { icon: CreditCard, label: 'Payments', path: '/payments', roles: ['ADMIN', 'RECEPTIONIST', 'STAFF', 'PATIENT'] },
    { icon: RotateCcw, label: 'Refunds', path: '/refunds', roles: ['ADMIN', 'RECEPTIONIST', 'STAFF'] },
    { icon: Bell, label: 'Notifications', path: '/notifications', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'PATIENT'] },
    { icon: UserCog, label: 'Users', path: '/admin/users', roles: ['ADMIN'] },
    { icon: Shield, label: 'Roles', path: '/admin/roles', roles: ['ADMIN'] },
    { icon: Key, label: 'Permissions', path: '/admin/permissions', roles: ['ADMIN'] },
  ];

  return (
    <div className="flex w-64 flex-col fixed inset-y-0 z-50 bg-white border-r border-gray-200">
      <div className="flex h-16 items-center flex-shrink-0 px-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500 rounded p-1">
            <PlusSquare className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            MediCare Sync
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-1 flex-1 space-y-1 px-2">
          {menuItems.map((item) => {
            if (item.roles && !item.roles.includes(userRole)) return null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-cyan-50 text-cyan-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5',
                        isActive
                          ? 'text-cyan-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <button
        onClick={logout}
        className="flex-shrink-0 group block w-full text-left hover:bg-gray-50 rounded-md p-2 transition-colors"
      >
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {user?.name || user?.username || 'User'}
            </p>
            <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
              Log Out
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default Sidebar;
