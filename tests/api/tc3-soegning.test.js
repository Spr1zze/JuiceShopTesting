// Automatiseret API-test af TC3 (produktsøgning) mod en kørende Juice Shop.
// Kør: npm run test:api   (BASE_URL kan sættes, standard er http://localhost:3000)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('TC3 – søgning på "apple" returnerer kun apple-produkter', async () => {
  const res = await fetch(`${BASE_URL}/rest/products/search?q=apple`);
  expect(res.status).toBe(200);

  const produkter = (await res.json()).data;
  expect(produkter.length).toBeGreaterThan(0);
  for (const p of produkter) {
    expect(`${p.name} ${p.description}`.toLowerCase()).toContain('apple');
  }
});
