import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState({
    wands: [],
    flexibilities: [],
    lengths: [],
    cores: [],
    woods: [], // Add woods to the state
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/tables')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading tables...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Wands Data</h1>

      <h2>Wands</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            {data.wands.length > 0 && Object.keys(data.wands[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.wands.map((row) => (
            <tr key={row.id}>
              {Object.values(row).map((val, i) => (
                <td key={i}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Flexibilities</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            {data.flexibilities.length > 0 && Object.keys(data.flexibilities[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.flexibilities.map((row) => (
            <tr key={row.id}>
              {Object.values(row).map((val, i) => (
                <td key={i}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Lengths</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            {data.lengths.length > 0 && Object.keys(data.lengths[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.lengths.map((row) => (
            <tr key={row.id}>
              {Object.values(row).map((val, i) => (
                <td key={i}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Woods</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            {data.woods.length > 0 && Object.keys(data.woods[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.woods.map((row) => (
            <tr key={row.id}>
              {Object.values(row).map((val, i) => (
                <td key={i}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Cores</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            {data.cores.length > 0 && Object.keys(data.cores[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.cores.map((row) => (
            <tr key={row.id}>
              {Object.values(row).map((val, i) => (
                <td key={i}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
