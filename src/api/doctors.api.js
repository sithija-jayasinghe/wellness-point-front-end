import http from './http';

export const getAllDoctors = async () => {
    const response = await http.get('/api/doctors/get-all');
    return response.data;
};

export const getDoctorById = async (id) => {
    const response = await http.get('/api/doctors/get-all');
    const doctor = response.data.find(
        (d) => String(d.id) === String(id)
    );
    if (!doctor) throw new Error(`Doctor with id ${id} not found`);
    return doctor;
};

export const createDoctor = async (data) => {
    const response = await http.post('/api/doctors/register', data);
    return response.data;
};

export const updateDoctor = async (id, data) => {
    const response = await http.put(`/api/doctors/update/${id}`, data);
    return response.data;
};

export const deleteDoctor = async (id) => {
    const response = await http.delete(`/api/doctors/delete/${id}`);
    return response.data;
};
