import http from './http';

export const getAllPermissions = async () => {
    console.log('Fetching permissions...');
    try {
        const response = await http.get('/api/permissions/get-all');
        console.log('Permissions API Response:', response.data);
        if (Array.isArray(response.data)) {
            return response.data;
        }
        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching permissions:', error);
        throw error;
    }
};

export const addPermission = async (data) => {
    const response = await http.post('/api/permissions/add', data);
    return response.data;
};
