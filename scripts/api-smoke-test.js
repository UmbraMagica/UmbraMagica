// @ts-check
import fetch from 'node-fetch';

// BASE_URL je pouze pro vývoj/testování. Pro produkci používejte relativní cesty nebo správnou doménu.
const BASE_URL = process.env.API_URL || '/';
const ADMIN_USER = process.env.TEST_ADMIN_USER || 'Casey';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'Twilight0';

let cookie = '';
let jwt = '';

function logResult(name, ok, extra = '') {
  if (ok) {
    console.log(`✅ ${name}`);
  } else {
    console.error(`❌ ${name} ${extra}`);
  }
}

async function testLogin() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  cookie = res.headers.get('set-cookie') || '';
  jwt = data.token || '';
  logResult('Login', res.ok, JSON.stringify(data));
  return res.ok;
}

async function testAuthUser() {
  const res = await fetch(`${BASE_URL}/api/auth/user`, {
    headers: { Cookie: cookie },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  logResult('GET /api/auth/user', res.ok, JSON.stringify(data));
  return res.ok;
}

async function testCharacters() {
  const res = await fetch(`${BASE_URL}/api/characters`, {
    headers: { Cookie: cookie },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  logResult('GET /api/characters', res.ok, JSON.stringify(data));
  return data[0]?.id;
}

async function testCharacterProfile(id) {
  const res = await fetch(`${BASE_URL}/api/characters/${id}`, {
    headers: { Cookie: cookie },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  logResult(`GET /api/characters/${id}`, res.ok, JSON.stringify(data));
}

async function testOwlPostInbox(id) {
  const res = await fetch(`${BASE_URL}/api/owl-post/inbox/${id}`, {
    headers: { Cookie: cookie },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  logResult(`GET /api/owl-post/inbox/${id}`, res.ok, JSON.stringify(data));
}

async function testInfluenceBar() {
  const res = await fetch(`${BASE_URL}/api/influence-bar`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const data = await res.json().catch(() => ({}));
  logResult('GET /api/influence-bar', res.ok, JSON.stringify(data));
}

async function testRoutesDebug() {
  const res = await fetch(`${BASE_URL}/api/debug/routes`);
  const data = await res.json().catch(() => ({}));
  logResult('GET /api/debug/routes', res.ok, JSON.stringify(data));
}

(async () => {
  await testRoutesDebug();
  const loginOk = await testLogin();
  if (!loginOk) return;
  await testAuthUser();
  const charId = await testCharacters();
  if (charId) {
    await testCharacterProfile(charId);
    await testOwlPostInbox(charId);
  }
  await testInfluenceBar();
})(); 