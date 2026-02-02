import http from './http';

export const getAllLogs = async () => {
    const response = await http.get('/audit-log/get-all');
    return response.data;
};

export const getLogsByUserId = async (userId) => {
    const response = await http.get(`/audit-log/user/${userId}`);
    return response.data;
};

export const getLogById = async (id) => {
    const response = await http.get(`/audit-log/${id}`);
    return response.data;
};
