import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-4cuv4ll4q-octotat-bots-projects.vercel.app';

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
    register: (data) => api.post('/api/auth/register', data),
    login: (data) => api.post('/api/auth/login', data),
    getCurrentUser: () => api.get('/api/auth/me')
};

/**
 * GROUP API
 */
export const groupAPI = {
    create: (data) => api.post('/api/groups', data),
    getAll: (includeArchived = false) => api.get(`/api/groups?includeArchived=${includeArchived}`),
    getById: (groupId) => api.get(`/api/groups/${groupId}`),
    addMember: (groupId, data) => api.post(`/api/groups/${groupId}/members`, data),
    getBalances: (groupId) => api.get(`/api/groups/${groupId}/balances`),
    getSettlement: (groupId, optimize = false) => api.get(`/api/groups/${groupId}/settlement?optimize=${optimize}`),
    getActivities: (groupId) => api.get(`/api/groups/${groupId}/activity`),
    removeMember: (groupId, memberId) => api.delete(`/api/groups/${groupId}/members/${memberId}`),
    deleteGroup: (groupId) => api.delete(`/api/groups/${groupId}`),
    recordSettlement: (groupId, data) => api.post(`/api/groups/${groupId}/settlements`, data),
    undoSettlement: (groupId, settlementId) => api.delete(`/api/groups/${groupId}/settlements/${settlementId}`),
    getUserSettlements: (groupId) => api.get(`/api/groups/${groupId}/user-settlements`),
    archiveGroup: (groupId) => api.put(`/api/groups/${groupId}/archive`),
    unarchiveGroup: (groupId) => api.put(`/api/groups/${groupId}/unarchive`),
    addAdmin: (groupId, userId) => api.post(`/api/groups/${groupId}/admins`, { userId }),
    removeAdmin: (groupId, adminId) => api.delete(`/api/groups/${groupId}/admins/${adminId}`)
};

export const expenseAPI = {
    create: (data) => api.post('/api/expenses', data),
    getByGroup: (groupId, params) => api.get(`/api/groups/${groupId}/expenses`, { params }),
    update: (expenseId, data) => api.put(`/api/expenses/${expenseId}`, data),
    delete: (expenseId) => api.delete(`/api/expenses/${expenseId}`)
};

export const notificationAPI = {
    getAll: (params) => api.get('/api/notifications', { params }),
    markAsRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
    markAllAsRead: () => api.put('/api/notifications/read-all'),
    delete: (notificationId) => api.delete(`/api/notifications/${notificationId}`),
    sendReminders: (groupId) => api.post(`/api/notifications/reminders/${groupId}`)
};

// Export base api for NotificationBell
export { api };

export default api;
