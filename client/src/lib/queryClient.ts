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
  return localStorage.getItem('jwt_token');
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
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

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(input, { ...init, headers });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    return response.text();
  }
}
