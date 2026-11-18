// Unit tests (person A). Kør: npm run test:unit
const { beregnTotal, validerEmail } = require('./kurv');

test('U1 – beregnTotal med gyldig kurv giver korrekt total', () => {
  const kurv = [
    { navn: 'Apple Juice', pris: 1.99, antal: 2 },
    { navn: 'Carrot Juice', pris: 2.99, antal: 1 },
  ];
  expect(beregnTotal(kurv)).toBe(6.97);
});

test('U2 – beregnTotal afviser negativt antal og 0', () => {
  expect(() => beregnTotal([{ pris: 1.99, antal: -1 }])).toThrow('Ugyldigt antal');
  expect(() => beregnTotal([{ pris: 1.99, antal: 0 }])).toThrow('Ugyldigt antal');
});

test('U3 – validerEmail godkender gyldig email', () => {
  expect(validerEmail('admin@juice-sh.op')).toBe(true);
});

test('U4 – validerEmail afviser ugyldige emails', () => {
  for (const email of ['admin', 'admin@', '@juice-sh.op', 'admin juice@sh.op', '']) {
    expect(validerEmail(email)).toBe(false);
  }
});
