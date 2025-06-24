
import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || '';

interface Character {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  deathDate?: string;
  isSystem?: boolean;
  isActive?: boolean;
}

interface SelectedCharacterContextType {
  selectedCharacter: Character | null;
  userCharacters: Character[];
  allUserCharacters: Character[];
  changeCharacter: (char: Character) => void;
  isLoading: boolean;
}

const SelectedCharacterContext = createContext<SelectedCharacterContextType | null>(null);

export function SelectedCharacterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Fetch user's characters
  const { data: allUserCharacters = [], isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const token = localStorage.getItem('jwt_token');
      if (!token) return [];
      
      const response = await fetch(`${API_URL}/api/characters`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch characters');
      }
      
      const data = await response.json();
      console.log('Context: Raw character data:', data);
      return Array.isArray(data) ? data : (data.characters || []);
    }
  });

  // Filter available characters (alive and not system)
  const userCharacters = allUserCharacters.filter((char: Character) => !char.deathDate && !char.isSystem);

  useEffect(() => {
    console.log("Context: Characters updated - all:", allUserCharacters.length, "available:", userCharacters.length);
    
    if (userCharacters && userCharacters.length > 0) {
      const savedId = localStorage.getItem("selectedCharacterId");
      let char: Character | null = null;
      
      if (savedId) {
        char = userCharacters.find((c: Character) => c.id === parseInt(savedId)) || null;
      }
      
      if (!char) {
        char = userCharacters.find((c: Character) => c.isActive) || userCharacters[0];
      }
      
      if (char && char.id !== selectedCharacter?.id) {
        console.log("Context: Setting character:", char);
        setSelectedCharacter(char);
        localStorage.setItem("selectedCharacterId", char.id.toString());
      }
    } else if (userCharacters.length === 0 && !isLoading) {
      // No characters available
      console.log("Context: No available characters");
      setSelectedCharacter(null);
      localStorage.removeItem("selectedCharacterId");
    }
  }, [userCharacters.length, allUserCharacters.length, isLoading, selectedCharacter?.id]);

  const changeCharacter = (char: Character) => {
    console.log("Context: Changing character to:", char);
    setSelectedCharacter(char);
    localStorage.setItem("selectedCharacterId", char.id.toString());
  };

  const contextValue: SelectedCharacterContextType = {
    selectedCharacter,
    userCharacters,
    allUserCharacters,
    changeCharacter,
    isLoading,
  };

  return (
    <SelectedCharacterContext.Provider value={contextValue}>
      {children}
    </SelectedCharacterContext.Provider>
  );
}

export function useSelectedCharacter(): SelectedCharacterContextType {
  const context = useContext(SelectedCharacterContext);
  if (!context) {
    throw new Error("useSelectedCharacter must be used within SelectedCharacterProvider");
  }
  return context;
}
