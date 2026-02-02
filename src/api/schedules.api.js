import http from './http';

export const getAllSchedules = async () => {
    const response = await http.get('/schedule/get-all');
    return response.data;
};

export const createSchedule = async (data) => {
    const response = await http.post('/schedule/add', data);
    return response.data;
};

export const updateSchedule = async (id, data) => {
    const response = await http.put(`/schedule/update/${id}`, data);
    return response.data;
};

export const deleteSchedule = async (id) => {
    const response = await http.delete(`/schedule/delete/${id}`);
    return response.data;
};
