import http from './http';

export const getAllLabTests = async () => {
    const response = await http.get('/api/lab-tests/get-all');
    return response.data;
};

export const getLabTestById = async (id) => {
    const response = await http.get(`/api/lab-tests/get/${id}`);
    return response.data;
};

export const getLabTestsByPatient = async (patientId) => {
    const response = await http.get(`/api/lab-tests/patient/${patientId}`);
    return response.data;
};

export const getLabTestsByOperator = async (labOperatorId) => {
    const response = await http.get(`/api/lab-tests/operator/${labOperatorId}`);
    return response.data;
};

export const getLabTestsByStatus = async (status) => {
    const response = await http.get(`/api/lab-tests/status/${status}`);
    return response.data;
};

export const getLabTestsByDoctor = async (doctorId) => {
    const response = await http.get(`/api/lab-tests/doctor/${doctorId}`);
    return response.data;
};

export const createLabTest = async (data) => {
    const response = await http.post('/api/lab-tests/add', data);
    return response.data;
};

export const updateLabTestResult = async (id, result, notes) => {
    const response = await http.put(`/api/lab-tests/update-result/${id}`, null, {
        params: { result, notes }
    });
    return response.data;
};

export const updateLabTestStatus = async (id, status) => {
    const response = await http.put(`/api/lab-tests/update-status/${id}`, null, {
        params: { status }
    });
    return response.data;
};

export const deleteLabTest = async (id) => {
    const response = await http.delete(`/api/lab-tests/delete/${id}`);
    return response.data;
};
