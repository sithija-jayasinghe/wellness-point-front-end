import http from './http';

export const getAllRoles = async () => {
    console.log('Fetching roles...');
    try {
        const response = await http.get('/api/roles/get-all');
        console.log('Roles API Response:', response.data);
        if (Array.isArray(response.data)) {
            return response.data;
        }
        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching roles:', error);
        throw error;
    }
};

export const addRole = async (data) => {
    const response = await http.post('/api/roles/add', data);
    return response.data;
};

export const addPermissionToRole = async (roleName, permissionCode) => {
    const response = await http.put('/api/roles/add-permission', null, {
        params: { roleName, permissionCode }
    });
    return response.data;
};
