#!/usr/bin/env node

// Script de pruebas rápidas de la API
const API_URL = 'http://localhost:3001/api/v1';

async function test() {
  console.log('🧪 Pruebas de API Optix\n');

  try {
    // 1. Health Check
    console.log('1️⃣  Health Check...');
    let res = await fetch('http://localhost:3001/health');
    console.log(`   ✅ Status ${res.status}: ${(await res.json()).status}\n`);

    // 2. Login
    console.log('2️⃣  Login con admin@optix.co...');
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@optix.co',
        password: 'Admin2026!',
      }),
    });
    const loginData = await res.json();
    const token = loginData.accessToken;
    console.log(`   ✅ Status ${res.status}`);
    console.log(`   👤 Usuario: ${loginData.user.name} (${loginData.user.role})\n`);

    // 3. Get Me
    console.log('3️⃣  Obteniendo datos del usuario...');
    res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await res.json();
    console.log(`   ✅ Status ${res.status}`);
    console.log(`   📧 Email: ${userData.email}\n`);

    // 4. Logout
    console.log('4️⃣  Cerrando sesión...');
    res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`   ✅ Status ${res.status}\n`);

    console.log('✅ Todas las pruebas pasaron correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
