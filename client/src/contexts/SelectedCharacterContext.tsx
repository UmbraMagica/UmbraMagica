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
  name?: string;
}

interface SelectedCharacterContextType {
  selectedCharacter: Character | null;
  userCharacters: Character[];
  changeCharacter: (char: Character) => void;
  isLoading: boolean;
  canSendAsNarrator: boolean;
}

const SelectedCharacterContext = createContext<SelectedCharacterContextType | null>(null);

export function SelectedCharacterProvider({ children, roomId, canSendAsNarrator }: { children: React.ReactNode, roomId: string, canSendAsNarrator: boolean }) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Fetch user's characters (always return array)
  const { data: userCharactersRaw = { characters: [] }, isLoading } = useQuery({
    queryKey: ["/api/characters"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('/api/characters', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return await res.json();
    }
  });
  const userCharacters: Character[] = Array.isArray(userCharactersRaw.characters)
    ? userCharactersRaw.characters.filter(
        (c) => c && typeof c.id === 'number' && typeof c.firstName === 'string'
      )
    : [];

  useEffect(() => {
    if (!roomId) return;
    if (userCharacters && userCharacters.length > 0) {
      const availableChars = userCharacters.filter((c: Character) => !c.deathDate && !c.isSystem);
      let options = [...availableChars];
      if (canSendAsNarrator) {
        options = [{ id: 0, firstName: 'Vypravěč', lastName: '', name: 'Vypravěč' }, ...options];
      }
      if (options.length === 0) {
        setSelectedCharacter(null);
        localStorage.removeItem(`selectedCharacterId_${roomId}`);
        return;
      }
      const savedId = localStorage.getItem(`selectedCharacterId_${roomId}`);
      let char: Character | null = null;
      if (savedId) {
        if (savedId === '0' && canSendAsNarrator) {
          char = { id: 0, firstName: 'Vypravěč', lastName: '', name: 'Vypravěč' };
        } else {
          char = options.find((c: Character) => c.id === parseInt(savedId)) || null;
        }
      }
      if (!char) {
        char = options.find((c: Character) => c.isActive) || options[0];
      }
      if (char && char.id !== selectedCharacter?.id) {
        setSelectedCharacter(char);
        localStorage.setItem(`selectedCharacterId_${roomId}`, char.id.toString());
      }
    } else if (userCharacters.length === 0 && !isLoading) {
      setSelectedCharacter(null);
      if (roomId) localStorage.removeItem(`selectedCharacterId_${roomId}`);
    }
  }, [userCharacters, isLoading, roomId, canSendAsNarrator]);

  const changeCharacter = (char: Character | null) => {
    // Validate character data before setting
    if (char && (!char.id || !char.firstName)) {
      console.error('Invalid character data:', char);
      return;
    }

    setSelectedCharacter(char);
    if (char) {
      localStorage.setItem(`selectedCharacterId_${roomId}`, char.id.toString());
    } else {
      localStorage.removeItem(`selectedCharacterId_${roomId}`);
    }
  };

  const contextValue: SelectedCharacterContextType = {
    selectedCharacter,
    userCharacters,
    changeCharacter,
    isLoading,
    canSendAsNarrator,
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