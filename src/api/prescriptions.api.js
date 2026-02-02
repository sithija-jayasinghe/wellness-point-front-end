import http from './http';

export const getAllPrescriptions = async () => {
    const response = await http.get('/api/prescriptions');
    return response.data;
};

export const getPrescriptionById = async (id) => {
    const response = await http.get(`/api/prescriptions/${id}`);
    return response.data;
};

export const createPrescription = async (data) => {
    const response = await http.post('/api/prescriptions', data);
    return response.data;
};

export const updatePrescription = async (id, data) => {
    const response = await http.put(`/api/prescriptions/${id}`, data);
    return response.data;
};

export const deletePrescription = async (id) => {
    const response = await http.delete(`/api/prescriptions/${id}`);
    return response.data;
};
