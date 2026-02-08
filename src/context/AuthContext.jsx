import React, { createContext, useContext, useState, useEffect } from 'react';
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
    // Initialize state from local storage to handle page refreshes (hydration)
    const [user, setUserState] = useState(() => {
        const storedUser = getStorageUser();
        const storedToken = getToken();
        // Check if we have both meaningful user data and a token
        if (storedUser && storedToken) {
            return {
                ...storedUser,
                token: storedToken // Ensure token is attached if needed in user object
            };
        }
        return null;
    });

    const isAuthenticated = !!user;

    const login = async (username, password) => {
        try {
            const data = await apiLogin(username, password);
            
            // Expected data structure: { token, userId, username, role, ... }
            if (data.token) {
                // 1. Store token
                setStorageToken(data.token);

                // 2. Prepare user object
                // If the backend returns flat fields (userId, username, role), we structure them
                // If it returns a nested 'user' object, we use that.
                // Based on LoginPage.jsx context, it seems to be flat or mix.
                // We'll construct a standardized user object.
                const userObj = {
                    id: data.id || data.userId,
                    name: data.name || data.username,
                    role: data.role, // e.g., 'ADMIN', 'DOCTOR'
                    username: data.username,
                    token: data.token,
                    ...data // Spread rest just in case
                };

                // 3. Store user in localStorage
                setStorageUser(userObj);

                // 4. Update State
                setUserState(userObj);
                
                return userObj;
            } else {
                 // Fallback if token is missing (unlikely if successful)
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
        // Optional: window.location.href = '/login'; // If specific redirect needed
    };

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
