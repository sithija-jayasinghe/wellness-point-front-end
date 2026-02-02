import http from './http';

export const getAllUsers = async () => {
    const response = await http.get('/api/users/get-all');
    return response.data;
};

export const registerUser = async (data) => {
    const response = await http.post('/api/users/register', data);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await http.put(`/api/users/update/${id}`, data);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await http.delete(`/api/users/delete/${id}`);
    return response.data;
};
