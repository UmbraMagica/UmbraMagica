const API_URL = import.meta.env.VITE_API_URL || '';

const response = await apiRequest("POST", `${API_URL}/api/auth/login`, credentials);
await apiRequest("POST", `${API_URL}/api/auth/logout`);
const response = await apiRequest("POST", `${API_URL}/api/auth/register`, data); 