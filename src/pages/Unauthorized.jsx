import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-8">
                    You do not have permission to view this page. If you believe this is an error, please contact your administrator.
                </p>
                
                <div className="flex justify-center gap-3">
                    <Button 
                        variant="outline" 
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" 
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
            </div>
        </div>
    );
};

export default Unauthorized;
