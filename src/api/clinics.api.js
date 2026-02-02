import http from './http';

export const getAllClinics = async () => {
    const response = await http.get('/api/clinics/get-all');
    return response.data;
};

export const createClinic = async (data) => {
    const response = await http.post('/api/clinics/add', data);
    return response.data;
};

export const updateClinic = async (id, data) => {
    const response = await http.put(`/api/clinics/update/${id}`, data);
    return response.data;
};

export const deleteClinic = async (id) => {
    const response = await http.delete(`/api/clinics/delete/${id}`);
    return response.data;
};
