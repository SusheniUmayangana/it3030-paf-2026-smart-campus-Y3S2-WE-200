import api from './api';

export const getUserNotifications = (userId) => api.get(`/notifications/user/${userId}`);

export const getUnreadCount = (userId) => api.get(`/notifications/user/${userId}/unread-count`);

export const markAsRead = (id) => api.patch(`/notifications/${id}/read`);

export const markAllAsRead = (userId) => api.patch(`/notifications/user/${userId}/read-all`);

export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
