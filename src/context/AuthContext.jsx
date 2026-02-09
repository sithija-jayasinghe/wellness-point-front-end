import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerLogout, registerNavigate } from '../api/authBridge';
import { login as apiLogin } from '../api/auth.api';
import { 
    getToken, 
    setToken as setStorageToken, 
    getUser as getStorageUser, 
    setUser as setStorageUser, 
    clearAuth 
} from '../auth/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    const [user, setUserState] = useState(() => {
        const storedUser = getStorageUser();
        const storedToken = getToken();
        if (storedUser && storedToken) {
             // Normalize role on hydration check
             if (storedUser.role) {
                // ToUpperCase FIRST to handle 'Role_Admin' correctly
                storedUser.role = storedUser.role.toUpperCase().replace('ROLE_', '').trim();
             }
            return {
                ...storedUser,
                token: storedToken
            };
        }
        return null;
    });

    const isAuthenticated = !!user;

    const login = async (username, password) => {
        try {
            const data = await apiLogin(username, password);

            if (data.token) {
                setStorageToken(data.token);

                // Determine raw role from 'role' (string) or 'roles' (array)
                let rawRole = data.role;
                if (!rawRole && Array.isArray(data.roles) && data.roles.length > 0) {
                    rawRole = data.roles[0]; // Take first role if array
                } else if (!rawRole && data.roles) {
                    rawRole = data.roles; // Handle if roles is string
                }


                // Normalize role to ensure consistency: Upper -> Remove Prefix -> Trim
                const normalizedRole = rawRole ? (typeof rawRole === 'string' ? rawRole : String(rawRole)).toUpperCase().replace('ROLE_', '').trim() : '';

                const userObj = {
                    ...data,
                    id: data.id || data.userId,
                    name: data.name || data.username,
                    role: normalizedRole,
                    username: data.username,
                    token: data.token
                };

                setStorageUser(userObj);
                setUserState(userObj);

                return userObj;
            } else {
                throw new Error("Token not received from server");
            }
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        clearAuth();
        setUserState(null);
        navigate('/login');
    };

    useEffect(() => {
        registerLogout(logout);
        registerNavigate(navigate);
    }, [navigate]);

    const value = {
        user,
        isAuthenticated,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
