import http from './http';

export const getAllAppointments = async () => {
    const response = await http.get('/appointment/get-all');
    return response.data;
};

export const getAppointmentById = async (id) => {
    const response = await http.get(`/appointment/${id}`);
    return response.data;
};

export const bookAppointment = async (data) => {
    // CORRECTED: Changed '/add' to '/book' based on your Controller
    const response = await http.post('/appointment/book', data);
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
    const response = await http.put(`/appointment/update/${id}`, data);
    return response.data;
};

export const cancelAppointment = async (id) => {
    // Fallback: Fetch -> Change Status -> Update
    // because dedicated endpoint returns 500 (likely Enum/Logic issue on backend)
    const current = await getAppointmentById(id);
    const payload = {
        id: parseInt(id), // Include ID in payload
        scheduleId: current.scheduleId,
        patientId: current.patientId,
        appointmentTime: formatTimeForUpdate(current.appointmentTime),
        status: 'CANCELLED'
    };
    return await updateAppointment(id, payload);
};

export const completeAppointment = async (id) => {
    // Fallback: Fetch -> Change Status -> Update
    const current = await getAppointmentById(id);
    const payload = {
        id: parseInt(id), // Include ID in payload
        scheduleId: current.scheduleId,
        patientId: current.patientId,
        appointmentTime: formatTimeForUpdate(current.appointmentTime),
        status: 'COMPLETED'
    };
    return await updateAppointment(id, payload);
};

export const deleteAppointment = async (id) => {
    const response = await http.delete(`/appointment/delete/${id}`);
    return response.data;
};