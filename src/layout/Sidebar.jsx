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
  PlusSquare,
  LogOut,
  LogIn,
  FlaskConical
} from 'lucide-react';
import { cn } from '../utils';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const userRole = user?.role;

  const adminLinks = [
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
    { icon: FlaskConical, label: 'Lab Tests', path: '/lab-tests' },
    { icon: UserCog, label: 'Users', path: '/admin/users' },
    { icon: Shield, label: 'Roles', path: '/admin/roles' },
    { icon: Key, label: 'Permissions', path: '/admin/permissions' },
  ];

  const doctorLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Schedules', path: '/schedules' },
    { icon: Clock, label: 'Appointments', path: '/appointments' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  const receptionLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Clinics', path: '/clinics' },
    { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Calendar, label: 'Schedules', path: '/schedules' },
    { icon: Clock, label: 'Appointments', path: '/appointments' },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: RotateCcw, label: 'Refunds', path: '/refunds' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  const patientLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
    { icon: Clock, label: 'Appointments', path: '/appointments' },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  const labOperatorLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FlaskConical, label: 'Lab Tests', path: '/lab-tests' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  let currentLinks = [];
  if (user) {
    switch (userRole) {
      case 'ADMIN':
        currentLinks = adminLinks;
        break;
      case 'DOCTOR':
        currentLinks = doctorLinks;
        break;
      case 'RECEPTIONIST':
      case 'STAFF':
        currentLinks = receptionLinks;
        break;
      case 'PATIENT':
        currentLinks = patientLinks;
        break;
      case 'LAB_OPERATOR':
        currentLinks = labOperatorLinks;
        break;
      default:
        currentLinks = [];
    }
  }

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
          {!user ? (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <LogIn className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Login
            </NavLink>
          ) : (
            currentLinks.map((item) => (
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
            ))
          )}
        </nav>
      </div>

      {user && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex flex-col gap-2">
            <div className="px-2 text-sm font-medium text-gray-900">
               {user.name || user.username || 'User'}
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 group transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


export default Sidebar;
