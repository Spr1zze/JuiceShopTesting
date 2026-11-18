// Små funktioner der bygger på webshoppen (Juice Shop). Testes i kurv.test.js (U1–U4).

// Beregner total for en kurv. Afviser antal under 1 – det er reglen Juice Shop mangler (se TC5).
function beregnTotal(varer) {
  let total = 0;
  for (const vare of varer) {
    if (!Number.isInteger(vare.antal) || vare.antal < 1) {
      throw new Error(`Ugyldigt antal: ${vare.antal}`);
    }
    total += vare.pris * vare.antal;
  }
  return Math.round(total * 100) / 100; // undgå 6.970000001 pga. kommatal
}

// Tjekker at en email har formen navn@domæne.endelse
function validerEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = { beregnTotal, validerEmail };
