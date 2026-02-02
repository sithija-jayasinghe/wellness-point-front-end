import React, { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../utils';
import { ToastContext } from './ToastContext';

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(({ title, description, variant = 'default', duration = 3000 }) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div className="fixed bottom-0 right-0 p-6 flex flex-col gap-2 w-full max-w-sm z-50 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto flex items-start w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 p-4 transform transition-all duration-300 ease-in-out",
                            toast.variant === 'destructive' && "bg-red-50 ring-red-200",
                            toast.variant === 'success' && "bg-green-50 ring-green-200"
                        )}
                    >
                        <div className="flex-shrink-0">
                            {toast.variant === 'success' && <CheckCircle className="h-6 w-6 text-green-400" />}
                            {toast.variant === 'destructive' && <AlertCircle className="h-6 w-6 text-red-400" />}
                            {toast.variant === 'default' && <Info className="h-6 w-6 text-blue-400" />}
                            {toast.variant === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-400" />}
                        </div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className={cn("text-sm font-medium text-gray-900", toast.variant === 'destructive' && "text-red-900", toast.variant === 'success' && "text-green-900")}>
                                {toast.title}
                            </p>
                            {toast.description && (
                                <p className={cn("mt-1 text-sm text-gray-500", toast.variant === 'destructive' && "text-red-700", toast.variant === 'success' && "text-green-700")}>
                                    {toast.description}
                                </p>
                            )}
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={() => removeToast(toast.id)}
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
