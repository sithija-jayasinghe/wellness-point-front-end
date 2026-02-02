import http from './http';

export const getAllPatients = async () => {
    const response = await http.get('/api/patients/get-all');
    return response.data;
};

export const createPatient = async (data) => {
    const response = await http.post('/api/patients/register', data);
    return response.data;
};

export const updatePatient = async (id, data) => {
    const response = await http.put(`/api/patients/update/${id}`, data);
    return response.data;
};

export const deletePatient = async (id) => {
    const response = await http.delete(`/api/patients/delete/${id}`);
    return response.data;
};

export const getPatientHistory = async (id) => {
    const response = await http.get(`/api/patients/${id}/medical-history`);
    return response.data;
};
