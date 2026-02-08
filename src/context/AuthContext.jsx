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
             // Normalize role on hydration just in case
             if (storedUser.role) {
                storedUser.role = storedUser.role.replace('ROLE_', '').toUpperCase();
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


                // Normalize role to ensure consistency (remove ROLE_ prefix)
                const normalizedRole = data.role ? data.role.replace('ROLE_', '').toUpperCase() : '';

                const userObj = {
                    id: data.id || data.userId,
                    name: data.name || data.username,
                    role: normalizedRole,
                    username: data.username,
                    token: data.token,
                    ...data
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
