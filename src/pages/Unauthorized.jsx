import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Get user info

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-4">
                    You do not have permission to view this page.
                </p>

                {/* Debugging Info for Development */}
                <div className="bg-gray-100 p-3 rounded-lg mb-6 text-sm text-left">
                    <p className="font-semibold text-gray-700 mb-1">Current Session Info:</p>
                    <p className="text-gray-600"><span className="font-medium">User:</span> {user?.username || 'Guest'}</p>
                    <p className="text-gray-600"><span className="font-medium">Role:</span> <span className="text-blue-600 font-mono">{user?.role || 'None'}</span></p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <div className="flex justify-center gap-3">
                        <Button 
                            variant="outline" 
                            className="border-gray-300" 
                            onClick={() => navigate(-1)}
                            icon={ArrowLeft}
                        >
                            Go Back
                        </Button>
                        <Button 
                             className="bg-cyan-600 hover:bg-cyan-700 text-white"
                             onClick={() => navigate('/')}
                        >
                            Dashboard
                        </Button>
                    </div>
                    <Button 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={logout}
                        icon={LogOut}
                    >
                        Logout & Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
