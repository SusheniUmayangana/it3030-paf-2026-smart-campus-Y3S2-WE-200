import api from './api';

export const createBooking = (data) => api.post('/bookings', data);

export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data);

export const getBookingById = (id) => api.get(`/bookings/${id}`);

export const getAllBookings = (status = null) => {
    const url = status ? `/bookings?status=${status}` : '/bookings';
    return api.get(url);
};

export const getUserBookings = (userId) => api.get(`/bookings/user/${userId}`);

export const getResourceBookings = (resourceId) => api.get(`/bookings/resource/${resourceId}`);

export const approveBooking = (id) => api.patch(`/bookings/${id}/approve`);

export const rejectBooking = (id, reason) => api.patch(`/bookings/${id}/reject`, { reason });

export const cancelBooking = (id) => api.patch(`/bookings/${id}/cancel`);

export const deleteBooking = (id) => api.delete(`/bookings/${id}`);
