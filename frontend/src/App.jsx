import React, { useEffect, useState } from 'react';

function App() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://umbramagica.onrender.com/api/characters/all')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((json) => {
        setCharacters(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Načítání postav...</div>;
  if (error) return <div>Chyba: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Postavy a jejich hůlky</h1>
      {characters.length === 0 && <p>Žádné postavy k zobrazení</p>}
      {characters.map((character) => (
        <div key={character.id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h2>{character.firstName} {character.lastName}</h2>
          {character.wand ? (
            <div>
              <h3>Hůlka</h3>
              <p>Dřevo: {character.wand.wood}</p>
              <p>Jádro: {character.wand.core}</p>
              <p>Délka: {character.wand.length}</p>
              <p>Flexibilita: {character.wand.flexibility}</p>
              <p>Popis: {character.wand.description}</p>
            </div>
          ) : (
            <p>Hůlka není nastavena</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
