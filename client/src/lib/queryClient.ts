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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log("=== FRONTEND API REQUEST ===");
  console.log("Method:", method);
  console.log("URL:", url);
  console.log("Data:", data);
  console.log("Full URL:", window.location.origin + url);
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log("Response status:", res.status);
  console.log("Response headers:", Object.fromEntries(res.headers.entries()));
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
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
