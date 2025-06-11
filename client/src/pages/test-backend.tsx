import React, { useEffect, useState } from 'react';

// Přidejte toto do souboru, pokud používáte TypeScript a Vite:
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL: string;
      // případně další proměnné
    };
  }
}

const TestBackend: React.FC = () => {
  const [result, setResult] = useState<string>('Načítám...');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/test`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const text = await res.text();
        setResult(`Status: ${res.status}\nOdpověď: ${text}`);
      })
      .catch((err) => {
        setResult(`Chyba: ${err.message}`);
      });
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1>Test spojení s backendem</h1>
      <pre>{result}</pre>
      <p>Backend URL: <b>{import.meta.env.VITE_API_URL}</b></p>
    </div>
  );
};

export default TestBackend; 