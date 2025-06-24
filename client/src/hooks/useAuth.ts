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

const API_URL = import.meta.env.VITE_API_URL || '';

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;

      const response = await fetch(`${API_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 404) {
        localStorage.removeItem('jwt_token');
        return null;
      }

      if (!response.ok) {
        console.error('Failed to fetch user:', response.status, response.statusText);
        throw new Error('Failed to fetch user');
      }

      const userData = await response.json();
      console.log('[useAuth] Loaded user data:', userData);
      
      // Pokud user nemá characters property, načti je zvlášť
      if (userData && !userData.characters) {
        try {
          const charactersResponse = await fetch(`${API_URL}/api/characters`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (charactersResponse.ok) {
            const charactersData = await charactersResponse.json();
            userData.characters = Array.isArray(charactersData) ? charactersData : (charactersData.characters || []);
          } else {
            userData.characters = [];
          }
        } catch (error) {
          console.error('[useAuth] Failed to fetch characters:', error);
          userData.characters = [];
        }
      }
      
      console.log('[useAuth] Final user data with characters:', userData);
      
      return userData;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getAuthToken(), // dotazuj jen pokud je token
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", `${API_URL}/api/auth/login`, credentials);
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('jwt_token', data.token);
      }
      return data.user || null;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`${API_URL}/api/auth/user`], data);
      setLocation("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem('jwt_token');
      queryClient.setQueryData([`${API_URL}/api/auth/user`], null);
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
      queryClient.setQueryData([`${API_URL}/api/auth/user`], data);
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