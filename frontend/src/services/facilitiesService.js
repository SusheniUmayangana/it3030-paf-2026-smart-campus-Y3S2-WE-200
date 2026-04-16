import axios from 'axios';

const API_URL = 'http://localhost:8080/api/resources';

export const getResources = () => axios.get(API_URL);
export const deleteResource = (id) => axios.delete(`${API_URL}/${id}`);
export const createResource = (data) => axios.post(API_URL, data);