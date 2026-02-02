import http from './http';

export const getDashboardStats = async () => {
  const response = await http.get('/reports/dashboard-stats');
  return response.data;
};
