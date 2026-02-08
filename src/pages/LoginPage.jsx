import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/useToast';
import Input from '../components/Input';
import Button from '../components/Button';
import { PlusSquare, Eye, EyeOff, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
        toast({
            title: 'Validation Error',
            description: 'Please enter both username and password.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    try {
      const user = await login(username, password);
      // user object returned from context handles everything
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${user.name || user.username}`,
        variant: 'success',
      });

      // Normalize role (remove ROLE_ prefix if present and uppercase)
      const role = user.role ? user.role.replace('ROLE_', '').toUpperCase() : '';

      // Check for redirect path
      const from = location.state?.from?.pathname;
      
      if (from) {
          navigate(from, { replace: true });
      } else {
          // Role-based redirection
          switch (role) {
              case 'ADMIN':
                  navigate('/admin/dashboard', { replace: true });
                  break;
              case 'DOCTOR':
                  navigate('/doctor/dashboard', { replace: true });
                  break;
              case 'RECEPTIONIST':
                  navigate('/reception/dashboard', { replace: true });
                  break;
              case 'PATIENT':
                  navigate('/patient/dashboard', { replace: true });
                  break;
              default:
                  // Default fallback or unauthorized
                  navigate('/', { replace: true });
                  break;
          }
      }
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'Invalid credentials or server error.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-[450px]">
        {/* Left Side - Image/Branding */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-teal-800 p-6 relative overflow-hidden">
             {/* Background Image Overlay */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/90 to-transparent"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
                        <PlusSquare className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">MediCare Sync</h1>
                </div>
            </div>

            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-3 leading-tight">Streamlined care for everyone.</h2>
                <p className="text-teal-100 text-sm">Manage appointments, records, and patient history in one secure portal.</p>
            </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Clinic Portal</h2>
                <p className="text-xs text-gray-500">Please sign in to access your dashboard.</p>
            </div>

            {/* Role Tab Switcher (Visual only for now matching image) */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button className="flex-1 py-1.5 text-xs font-medium rounded-md bg-white text-gray-900 shadow-sm transition-all">Doctor</button>
                <button className="flex-1 py-1.5 text-xs font-medium rounded-md text-gray-500 hover:text-gray-900 transition-all">Staff</button>
                <button className="flex-1 py-1.5 text-xs font-medium rounded-md text-gray-500 hover:text-gray-900 transition-all">Patient</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Email Address</label>
                    <Input 
                        type="text" 
                        placeholder="name@clinic.com" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-10 bg-gray-50 border-gray-200 focus:bg-white text-sm"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Password</label>
                    <div className="relative">
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-10 bg-gray-50 border-gray-200 focus:bg-white pr-10 text-sm"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <button type="button" className="text-xs font-medium text-cyan-600 hover:text-cyan-500">
                        Forgot Password?
                    </button>
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-10 text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-500/30"
                    isLoading={isLoading}
                >
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
                New patient? <button type="button" className="font-semibold text-cyan-600 hover:text-cyan-500">Register here</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
