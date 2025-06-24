import React, { createContext, useContext, useState, useEffect } from "react";

const SelectedCharacterContext = createContext<any>(null);

export function SelectedCharacterProvider({ userCharacters, children }: { userCharacters: any[], children: React.ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  useEffect(() => {
    if (userCharacters && userCharacters.length > 0) {
      const availableChars = userCharacters.filter((c: any) => !c.deathDate && !c.isSystem);
      if (availableChars.length === 0) {
        setSelectedCharacter(null);
        return;
      }

      const savedId = localStorage.getItem("selectedCharacterId");
      let char = null;
      
      if (savedId) {
        char = availableChars.find((c: any) => c.id === parseInt(savedId));
      }
      
      if (!char) {
        char = availableChars.find((c: any) => c.isActive) || availableChars[0];
      }
      
      if (char && char.id !== selectedCharacter?.id) {
        setSelectedCharacter(char);
        localStorage.setItem("selectedCharacterId", char.id.toString());
      }
    }
  }, [userCharacters]);

  const changeCharacter = (char: any) => {
    setSelectedCharacter(char);
    localStorage.setItem("selectedCharacterId", char.id.toString());
  };

  return (
    <SelectedCharacterContext.Provider value={{ selectedCharacter, changeCharacter }}>
      {children}
    </SelectedCharacterContext.Provider>
  );
}

export function useSelectedCharacter() {
  return useContext(SelectedCharacterContext);
} 