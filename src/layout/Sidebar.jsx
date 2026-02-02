import React from 'react';
import { NavLink } from 'react-router-dom';
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
  ClipboardList, 
  IdCard, 
  UserCog, 
  Shield, 
  Key,
  PlusSquare
} from 'lucide-react';
import { cn } from '../utils';

const Sidebar = ({ user }) => {
  const isAdmin = user?.role === 'ADMIN';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Clinics', path: '/clinics' },
    { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Calendar, label: 'Schedules', path: '/schedules' },
    { icon: Clock, label: 'Appointments', path: '/appointments' },
    { icon: FileText, label: 'Consultations', path: '/consultations' },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: RotateCcw, label: 'Refunds', path: '/refunds' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: ClipboardList, label: 'Audit Logs', path: '/audit-logs' },
    { icon: IdCard, label: 'Staff', path: '/staff' },
    // Admin only
    { icon: UserCog, label: 'Users', path: '/users', adminOnly: true },
    { icon: Shield, label: 'Roles', path: '/roles', adminOnly: true },
    { icon: Key, label: 'Permissions', path: '/permissions', adminOnly: true },
  ];

  return (
    <div className="flex w-64 flex-col fixed inset-y-0 z-50 bg-white border-r border-gray-200">
      <div className="flex h-16 items-center flex-shrink-0 px-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
            <div className="bg-cyan-500 rounded p-1">
                <PlusSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">MediCare Sync</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-1 flex-1 space-y-1 px-2">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            
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
                        isActive ? 'text-cyan-500' : 'text-gray-400 group-hover:text-gray-500'
                      )}
                      aria-hidden="true"
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 group block w-full">
            <div className="flex items-center">
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                     Internal System
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                     v1.0.0
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
