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
    console.log('[processCharacters] FULL DEBUG - Input data:', charactersData);
    console.log('[processCharacters] FULL DEBUG - Input type:', typeof charactersData);
    console.log('[processCharacters] FULL DEBUG - Is array:', Array.isArray(charactersData));

    // Simplified logic - expect array directly since we extract it above
    let charactersArray: any[] = [];

    if (Array.isArray(charactersData)) {
      charactersArray = charactersData;
      console.log('[processCharacters] FULL DEBUG - Using direct array');
    } else {
      console.log('[processCharacters] FULL DEBUG - Expected array but got:', typeof charactersData);
      return [];
    }

    console.log('[processCharacters] FULL DEBUG - Characters array:', charactersArray);
    console.log('[processCharacters] FULL DEBUG - Characters array length:', charactersArray.length);

    const validCharacters = charactersArray.filter((char, index) => {
      console.log(`[processCharacters] FULL DEBUG - Checking character ${index}:`, char);

      const isValid = isValidCharacter(char);
      console.log(`[processCharacters] FULL DEBUG - Character ${index} valid:`, isValid);

      if (!isValid && char) {
        console.log(`[processCharacters] FULL DEBUG - Invalid character ${index}:`, {
          id: char.id,
          firstName: char.firstName,
          userId: char.userId,
          hasId: typeof char.id === 'number',
          hasFirstName: typeof char.firstName === 'string',
          hasUserId: typeof char.userId === 'number'
        });
      }
      return isValid;
    });

    console.log('[processCharacters] FULL DEBUG - Valid characters:', validCharacters);
    console.log('[processCharacters] FULL DEBUG - Valid characters count:', validCharacters.length);
    return validCharacters;
  } catch (error) {
    console.error('[processCharacters] FULL DEBUG - Error processing characters:', error);
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
        console.log('[useAuth] FULL DEBUG - Loaded user data:', userData);

        if (!userData) return null;

        // Vždy načti postavy zvlášť pro aktuální data
        try {
          const charactersResponse = await fetch(`${API_URL}/api/characters`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('[useAuth] FULL DEBUG - Characters response status:', charactersResponse.status);

          if (charactersResponse.ok) {
            const charactersData = await charactersResponse.json();
            console.log('[useAuth] FULL DEBUG - Raw characters data:', charactersData);
            console.log('[useAuth] FULL DEBUG - Characters data type:', typeof charactersData);
            console.log('[useAuth] FULL DEBUG - Is array:', Array.isArray(charactersData));

            // Backend vrací { characters: [...] }, takže extrahujme přímo characters array
            const charactersArray = charactersData?.characters || charactersData || [];
            console.log('[useAuth] FULL DEBUG - Extracted characters array:', charactersArray);
            
            userData.characters = processCharacters(charactersArray);
            console.log('[useAuth] FULL DEBUG - Processed characters:', userData.characters);
            console.log('[useAuth] FULL DEBUG - Processed characters count:', userData.characters?.length || 0);
          } else {
            console.warn('[useAuth] FULL DEBUG - Failed to fetch characters, status:', charactersResponse.status);
            userData.characters = [];
          }
        } catch (error) {
          console.error('[useAuth] FULL DEBUG - Failed to fetch characters:', error);
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
      // Clear any existing character selections to prevent wrong character display
      localStorage.removeItem('selectedCharacterId');
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('selectedCharacterId_')) {
          localStorage.removeItem(key);
        }
      });
      
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
      // Clear any existing selectedCharacterId to prevent wrong character selection
      localStorage.removeItem('selectedCharacterId');
      
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