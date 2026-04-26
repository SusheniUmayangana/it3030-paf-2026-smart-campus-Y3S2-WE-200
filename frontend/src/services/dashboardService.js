import api from './api';

export const getAdminStats = () => api.get('/dashboard/admin-stats');

export const getUserStats = (userId) => api.get(`/dashboard/user-stats/${userId}`);
