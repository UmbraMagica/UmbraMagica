import fetch from 'node-fetch';

// Tento skript je pouze pro vývoj/testování. Pro produkci používejte relativní cesty nebo správnou doménu.
const url = '/api/auth/login';
const username = 'Casey';
const password = 'Twilight0';

async function testLogin() {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Odpověď:', data);
}

testLogin(); 