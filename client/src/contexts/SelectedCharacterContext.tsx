
import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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
  changeCharacter: (char: Character) => void;
  isLoading: boolean;
}

const SelectedCharacterContext = createContext<SelectedCharacterContextType | null>(null);

export function SelectedCharacterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Fetch user's characters
  const { data: userCharacters = [], isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    console.log("Context: userCharacters updated:", userCharacters.length);
    
    if (userCharacters && userCharacters.length > 0) {
      const availableChars = userCharacters.filter((c: Character) => !c.deathDate && !c.isSystem);
      
      if (availableChars.length === 0) {
        setSelectedCharacter(null);
        localStorage.removeItem("selectedCharacterId");
        return;
      }

      const savedId = localStorage.getItem("selectedCharacterId");
      let char: Character | null = null;
      
      if (savedId) {
        char = availableChars.find((c: Character) => c.id === parseInt(savedId)) || null;
      }
      
      if (!char) {
        char = availableChars.find((c: Character) => c.isActive) || availableChars[0];
      }
      
      if (char && char.id !== selectedCharacter?.id) {
        console.log("Context: Setting character:", char);
        setSelectedCharacter(char);
        localStorage.setItem("selectedCharacterId", char.id.toString());
      }
    } else if (userCharacters.length === 0 && !isLoading) {
      // No characters available
      setSelectedCharacter(null);
      localStorage.removeItem("selectedCharacterId");
    }
  }, [userCharacters, isLoading]);

  const changeCharacter = (char: Character) => {
    console.log("Context: Changing character to:", char);
    setSelectedCharacter(char);
    localStorage.setItem("selectedCharacterId", char.id.toString());
  };

  const contextValue: SelectedCharacterContextType = {
    selectedCharacter,
    userCharacters,
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
