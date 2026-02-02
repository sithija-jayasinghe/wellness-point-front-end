import http from './http';

export const login = async (username, password) => {
  const response = await http.post('/api/users/login', { username, password });
  return response.data;
};
