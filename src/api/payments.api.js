import http from './http';

export const getAllPayments = async () => {
    const response = await http.get('/api/payments/get-all');
    return response.data;
};

export const getPaymentById = async (id) => {
    const response = await http.get(`/api/payments/${id}`);
    return response.data;
};

export const addPayment = async (data) => {
    const response = await http.post('/api/payments/add', data);
    return response.data;
};

export const updatePayment = async (id, data) => {
    const response = await http.put(`/api/payments/update/${id}`, data);
    return response.data;
};

export const deletePayment = async (id) => {
    const response = await http.delete(`/api/payments/delete/${id}`);
    return response.data;
};
