import fetch from 'node-fetch';

const url = 'https://umbramagica.onrender.com/api/auth/login';
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