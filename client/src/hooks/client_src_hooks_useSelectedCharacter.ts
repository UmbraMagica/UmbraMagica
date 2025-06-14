import { useState, useEffect } from "react";

export function useSelectedCharacter(userCharacters: any[]) {
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);

  useEffect(() => {
    if (!userCharacters || userCharacters.length === 0) return;

    const storedId = localStorage.getItem("selectedCharacterId");
    let found = null;

    if (storedId) {
      found = userCharacters.find((c) => c.id === parseInt(storedId));
    }
    if (!found) {
      found = userCharacters.find((c) => !c.deathDate) || userCharacters[0];
      localStorage.setItem("selectedCharacterId", found.id.toString());
    }
    setSelectedCharacter(found);
  }, [userCharacters]);

  const selectCharacter = (characterId: number) => {
    const found = userCharacters.find((c) => c.id === characterId);
    if (found) {
      setSelectedCharacter(found);
      localStorage.setItem("selectedCharacterId", characterId.toString());
      // zde invalidateQueries nebo refetch
    }
  };

  return [selectedCharacter, selectCharacter] as const;
}