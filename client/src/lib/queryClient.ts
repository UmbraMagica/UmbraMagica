import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Clone response to avoid consuming the body
      const resClone = res.clone();
      const errorData = await resClone.json();
      console.log('API Error Response:', errorData); // Debug log
      throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
    } catch (parseError) {
      console.log('JSON Parse Error:', parseError); // Debug log
      // If JSON parsing fails, fallback to text from original response
      try {
        const text = await res.text();
        console.log('Error Response Text:', text); // Debug log
        throw new Error(text || `${res.status}: ${res.statusText}`);
      } catch {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
    }
  }
}

export function getAuthToken() {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    console.warn('No auth token found in localStorage');
    return null;
  }
  console.log('Current auth token:', token);
  return token;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Login endpoint nemusí mít token
  const needsToken = !url.endsWith('/login');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (needsToken) {
    const token = getAuthToken();
    if (!token) {
      console.warn('Request without token:', url);
      throw new Error('No authentication token available');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('Making request to:', url, { method, headers });
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "omit", // JWT nepotřebuje cookies
  });
  
  if (!res.ok) {
    console.error('Request failed:', url, res.status);
    await throwIfResNotOk(res);
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "omit",
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
