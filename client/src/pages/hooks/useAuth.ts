const response = await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/auth/login`, credentials);
await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/auth/logout`);
const response = await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/auth/register`, data); 