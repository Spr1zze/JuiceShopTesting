// Automatiseret API-test af TC7 (SQL injection i login) mod en kørende Juice Shop.
// Forventet i en sikker webshop: login afvises med 401.
// RØD mod den originale Juice Shop (sårbar med vilje). GRØN når SQLi-fixet i routes/login.ts er lavet.
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('TC7 – login med SQL injection i email bliver afvist', async () => {
  const res = await fetch(`${BASE_URL}/rest/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "' OR 1=1--", password: 'vilkaarlig' }),
  });
  expect(res.status).toBe(401);
});
