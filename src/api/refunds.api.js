import http from './http';

export const getAllRefunds = async () => {
    const response = await http.get('/api/refunds/get-all');
    return response.data;
};

export const getRefundById = async (id) => {
    const response = await http.get(`/api/refunds/${id}`);
    return response.data;
};

export const createRefund = async (data) => {
    const response = await http.post('/api/refunds/add', data);
    return response.data;
};

export const updateRefund = async (id, data) => {
    const response = await http.put(`/api/refunds/update/${id}`, data);
    return response.data;
};

export const deleteRefund = async (id) => {
    const response = await http.delete(`/api/refunds/delete/${id}`);
    return response.data;
};
