import http from './http';

export const getAllNotifications = async () => {
    const response = await http.get('/notification/get-all');
    return response.data;
};

export const getNotificationsByUserId = async (userId) => {
    const response = await http.get(`/notification/user/${userId}`);
    return response.data;
};

export const sendNotification = async (data) => {
    const response = await http.post('/notification/send', data);
    return response.data;
};

export const deleteNotification = async (id) => {
    const response = await http.delete(`/notification/delete/${id}`);
    return response.data;
};
