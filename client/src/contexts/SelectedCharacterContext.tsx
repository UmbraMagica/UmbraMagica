import React, { createContext, useContext, useState, useEffect } from "react";

const SelectedCharacterContext = createContext<any>(null);

export function SelectedCharacterProvider({ userCharacters, children }: { userCharacters: any[], children: React.ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  useEffect(() => {
    if (userCharacters && userCharacters.length > 0) {
      const savedId = localStorage.getItem("selectedCharacterId");
      let char = null;
      if (savedId) {
        char = userCharacters.find((c: any) => c.id === parseInt(savedId));
      }
      if (!char) {
        char = userCharacters.find((c: any) => c.isActive && !c.deathDate) || userCharacters.find((c: any) => !c.deathDate);
      }
      setSelectedCharacter(char);
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