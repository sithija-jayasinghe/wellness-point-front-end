import http from './http';

export const getAllConsultations = async () => {
    const response = await http.get('/api/consultations');
    return response.data;
};

export const getConsultationById = async (id) => {
    const response = await http.get(`/api/consultations/${id}`);
    return response.data;
};

export const createConsultation = async (data) => {
    const response = await http.post('/api/consultations', data);
    return response.data;
};

export const updateConsultation = async (id, data) => {
    const response = await http.put(`/api/consultations/${id}`, data);
    return response.data;
};

export const deleteConsultation = async (id) => {
    if (!id) throw new Error("Consultation ID is required");
    // Ensure ID is treated as a string and trimmed
    const validId = String(id).trim();
    await http.delete(`/api/consultations/${validId}`);
};
