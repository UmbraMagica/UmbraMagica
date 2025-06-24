
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
  deathDate?: string;
  isSystem?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || '';

// Helper function to validate character object
function isValidCharacter(char: any): char is Character {
  return char && 
         typeof char === 'object' && 
         typeof char.id === 'number' && 
         typeof char.firstName === 'string' && 
         char.firstName.trim() !== '' &&
         typeof char.userId === 'number';
}

// Helper function to safely process characters
function processCharacters(charactersData: any): Character[] {
  try {
    console.log('[processCharacters] Input data:', charactersData);
    let charactersArray: any[] = [];
    
    if (Array.isArray(charactersData)) {
      charactersArray = charactersData;
    } else if (charactersData && Array.isArray(charactersData.characters)) {
      charactersArray = charactersData.characters;
    } else if (charactersData && typeof charactersData === 'object') {
      // Try to find any array in the object
      const values = Object.values(charactersData);
      const arrayValue = values.find(val => Array.isArray(val));
      if (arrayValue) {
        charactersArray = arrayValue as any[];
      }
    }

    console.log('[processCharacters] Characters array:', charactersArray);
    const validCharacters = charactersArray.filter(char => {
      const isValid = isValidCharacter(char);
      if (!isValid && char) {
        console.log('[processCharacters] Invalid character filtered:', char);
      }
      return isValid;
    });
    
    console.log('[processCharacters] Valid characters:', validCharacters);
    return validCharacters;
  } catch (error) {
    console.error('Error processing characters data:', error);
    return [];
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;

      try {
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
        console.log('[useAuth] Loaded user data:', userData ? { id: userData.id, username: userData.username, role: userData.role } : null);

        if (!userData) return null;

        // Vždy načti postavy zvlášť pro aktuální data
        try {
          const charactersResponse = await fetch(`${API_URL}/api/characters`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (charactersResponse.ok) {
            const charactersData = await charactersResponse.json();
            console.log('[useAuth] Raw characters data:', charactersData);
            userData.characters = processCharacters(charactersData);
            console.log('[useAuth] Processed characters:', userData.characters);
          } else {
            console.warn('Failed to fetch characters separately');
            userData.characters = [];
          }
        } catch (error) {
          console.error('[useAuth] Failed to fetch characters:', error);
          userData.characters = [];
        }

        return userData;
      } catch (error) {
        console.error('[useAuth] Query error:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getAuthToken(),
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
      queryClient.setQueryData(['/api/auth/user'], data);
      setLocation("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem('jwt_token');
      queryClient.setQueryData(['/api/auth/user'], null);
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
      queryClient.setQueryData(['/api/auth/user'], data);
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
