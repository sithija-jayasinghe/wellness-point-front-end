import http from './http';

export const getAllPrescriptions = async () => {
    const response = await http.get('/prescriptions/get-all');
    return response.data;
};

export const getPrescriptionById = async (id) => {
    const response = await http.get(`/prescriptions/${id}`);
    return response.data;
};

export const createPrescription = async (data) => {
    const response = await http.post('/prescriptions/add', data);
    return response.data;
};

export const updatePrescription = async (id, data) => {
    const response = await http.put(`/prescriptions/update/${id}`, data);
    return response.data;
};

export const deletePrescription = async (id) => {
    const response = await http.delete(`/prescriptions/delete/${id}`);
    return response.data;
};
