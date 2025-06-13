import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn, getAuthToken } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { User } from "@shared/types";

interface AuthUser extends User {
  characters: Character[];
}

interface Character {
  id: number;
  userId: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  isActive: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: [`${import.meta.env.VITE_API_URL}/api/auth/user`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getAuthToken(), // dotazuj jen pokud je token
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/auth/login`, credentials);
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('jwt_token', data.token);
      }
      return data.user || null;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`${import.meta.env.VITE_API_URL}/api/auth/user`], data);
      setLocation("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem('jwt_token');
      queryClient.setQueryData([`${import.meta.env.VITE_API_URL}/api/auth/user`], null);
    },
    onSuccess: () => {
      queryClient.removeQueries();
      setLocation("/login");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      username: string;
      email: string;
      password: string;
      passwordConfirm: string;
      inviteCode: string;
      firstName: string;
      middleName?: string;
      lastName: string;
      birthDate: string;
    }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`${import.meta.env.VITE_API_URL}/api/auth/user`], data);
      queryClient.invalidateQueries();
      setLocation("/");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
