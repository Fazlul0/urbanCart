import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('uc_token');
        localStorage.removeItem('uc_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const changePassword = (data) => api.put('/auth/password', data);

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const getRelatedProducts = (id) => api.get(`/products/${id}/related`);

// Categories
export const getCategories = (params) => api.get('/categories', { params });

// Hero
export const getHeroImages = () => api.get('/hero');

// Media
export const uploadImage = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Membership
export const getMembershipSettings = () => api.get('/membership/settings');
export const applyMembership = (data) => api.post('/membership/apply', data);
export const getMyMembershipApplications = () => api.get('/membership/my');

// Site branding
export const getSiteSettings = () => api.get('/site/settings');

// Cart
export const getCart = () => api.get('/cart');
export const addToCart = (productId, quantity = 1) =>
  api.post('/cart/add', { productId, quantity });
export const updateCartItem = (productId, quantity) =>
  api.put('/cart/update', { productId, quantity });
export const removeFromCart = (productId) => api.delete(`/cart/${productId}`);
export const clearCart = () => api.delete('/cart/clear');

// Orders
export const createOrder = (data) => api.post('/orders', data);
export const getMyOrders = () => api.get('/orders/my');
export const getMyOrder = (id) => api.get(`/orders/my/${id}`);

// Reviews
export const getProductReviews = (productId) =>
  api.get(`/reviews/product/${productId}`);
export const createReview = (data) => api.post('/reviews', data);
