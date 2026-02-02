export const getToken = () => localStorage.getItem('auth_token');

export const setToken = (token) => localStorage.setItem('auth_token', token);

export const clearToken = () => localStorage.removeItem('auth_token');

export const getUser = () => {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
};

export const setUser = (user) => localStorage.setItem('auth_user', JSON.stringify(user));

export const clearUser = () => localStorage.removeItem('auth_user');

export const clearAuth = () => {
    clearToken();
    clearUser();
};
