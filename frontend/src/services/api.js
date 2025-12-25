import axios from 'axios';

/**
 * API CLIENT
 * Centralized HTTP client with authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

/**
 * AUTH API
 */
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getCurrentUser: () => api.get('/auth/me')
};

/**
 * GROUP API
 */
export const groupAPI = {
    create: (data) => api.post('/groups', data),
    getAll: (includeArchived = false) => api.get(`/groups?includeArchived=${includeArchived}`),
    getById: (groupId) => api.get(`/groups/${groupId}`),
    addMember: (groupId, data) => api.post(`/groups/${groupId}/members`, data),
    getBalances: (groupId) => api.get(`/groups/${groupId}/balances`),
    getSettlement: (groupId, optimize = false) => api.get(`/groups/${groupId}/settlement?optimize=${optimize}`),
    getActivities: (groupId) => api.get(`/groups/${groupId}/activity`),
    removeMember: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
    deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),
    recordSettlement: (groupId, data) => api.post(`/groups/${groupId}/settlements`, data),
    undoSettlement: (groupId, settlementId) => api.delete(`/groups/${groupId}/settlements/${settlementId}`),
    getUserSettlements: (groupId) => api.get(`/groups/${groupId}/user-settlements`),
    // Archive management
    archiveGroup: (groupId) => api.put(`/groups/${groupId}/archive`),
    unarchiveGroup: (groupId) => api.put(`/groups/${groupId}/unarchive`),
    // Admin management
    addAdmin: (groupId, userId) => api.post(`/groups/${groupId}/admins`, { userId }),
    removeAdmin: (groupId, adminId) => api.delete(`/groups/${groupId}/admins/${adminId}`)
};

/**
 * EXPENSE API
 */
export const expenseAPI = {
    create: (data) => api.post('/expenses', data),
    getByGroup: (groupId, params) => api.get(`/groups/${groupId}/expenses`, { params }),
    update: (expenseId, data) => api.put(`/expenses/${expenseId}`, data),
    delete: (expenseId) => api.delete(`/expenses/${expenseId}`)
};

/**
 * NOTIFICATION API
 */
export const notificationAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (notificationId) => api.delete(`/notifications/${notificationId}`),
    sendReminders: (groupId) => api.post(`/notifications/reminders/${groupId}`)
};

// Export base api for NotificationBell
export { api };

export default api;
