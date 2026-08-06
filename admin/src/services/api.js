import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uc_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const adminLogin = (data) => api.post('/auth/admin/login', data);
export const getMe = () => api.get('/auth/me');

export const getStats = () => api.get('/admin/stats');
export const getAdminProducts = (params) => api.get('/admin/products', { params });
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const getCategories = (params) => api.get('/categories/all', { params });
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id, force = false) =>
  api.delete(`/categories/${id}${force ? '?force=true' : ''}`);

export const getMembershipSettings = () => api.get('/membership/settings');
export const updateMembershipSettings = (data) => api.put('/membership/settings', data);

export const getSiteSettings = () => api.get('/site/settings');
export const updateSiteSettings = (data) => api.put('/site/settings', data);
export const getMembershipApplications = (params) =>
  api.get('/membership/applications', { params });
export const updateMembershipApplication = (id, data) =>
  api.put(`/membership/applications/${id}`, data);

export const uploadImage = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getHeroImagesAdmin = () => api.get('/hero/all');
export const createHeroImage = (data) => api.post('/hero', data);
export const updateHeroImage = (id, data) => api.put(`/hero/${id}`, data);
export const deleteHeroImage = (id) => api.delete(`/hero/${id}`);

export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => api.put(`/orders/${id}/status`, data);

export const getReviews = (params) => api.get('/reviews', { params });
export const hideReview = (id) => api.put(`/reviews/${id}/hide`);
export const deleteReview = (id) => api.delete(`/reviews/${id}`);

export const getUsers = (params) => api.get('/admin/users', { params });
export const banUser = (id) => api.put(`/admin/users/${id}/ban`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
