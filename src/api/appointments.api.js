import http from './http';

export const getAllAppointments = async () => {
    const response = await http.get('/api/appointment/get-all');
    return response.data;
};

export const getAppointmentById = async (id) => {
    const response = await http.get(`/api/appointment/${id}`);
    return response.data;
};

export const bookAppointment = async (data) => {
    // CORRECTED: Changed '/add' to '/book' based on your Controller
    const response = await http.post('/api/appointment/book', data);
    return response.data;
};

// Helper to format Java LocalDateTime array to String for update payload
const formatTimeForUpdate = (t) => {
    if (!t) return null;
    if (Array.isArray(t)) {
        const [y, m, d, h, min, s = 0] = t;
        const pad = n => String(n).padStart(2, '0');
        // Construct ISO-like string YYYY-MM-DDTHH:mm:00
        return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}`;
    }
    // If already string (e.g. ISO), just ensure it has seconds if backend is strict? 
    // Usually backend handles ISO 8601.
    return t; 
};

export const updateAppointment = async (id, data) => {
    const response = await http.put(`/api/appointment/update/${id}`, data);
    return response.data;
};

export const cancelAppointment = async (id) => {
    // There is a dedicated endpoint for cancellation which is much cleaner
    const response = await http.put(`/api/appointment/${id}/cancel`);
    return response.data;
};

export const completeAppointment = async (id) => {
    // There is a dedicated endpoint for completion which is much cleaner
    const response = await http.put(`/api/appointment/${id}/complete`);
    return response.data;
};

export const deleteAppointment = async (id) => {
    const response = await http.delete(`/api/appointment/delete/${id}`);
    return response.data;
};