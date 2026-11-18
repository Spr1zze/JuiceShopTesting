// Belastningstest af lokal Juice Shop med k6.
// Kør via load/koer-belastning.ps1 (den kører 1 -> 5 -> 10 -> 20 brugere og måler CPU/RAM).
// Hver virtuel bruger: åbner forsiden, henter produktlisten og søger.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://host.docker.internal:3000';
const VUS = Number(__ENV.VUS || 1);
const OUT = __ENV.OUT || '/out'; // Docker-runneren bruger /out; den lokale runner (koer-belastning-lokal.ps1) sætter en Windows-mappe

export const options = {
  vus: VUS,
  duration: __ENV.DURATION || '30s',
};

const soegeord = ['apple', 'juice', 'banana', 'lemon', ''];

export default function () {
  const forside = http.get(`${BASE}/`, { tags: { navn: 'forside' } });
  check(forside, { 'forside 200': (r) => r.status === 200 });

  const produkter = http.get(`${BASE}/api/Products`, { tags: { navn: 'produkter' } });
  check(produkter, { 'produkter 200': (r) => r.status === 200 });

  const q = soegeord[Math.floor(Math.random() * soegeord.length)];
  const soeg = http.get(`${BASE}/rest/products/search?q=${q}`, { tags: { navn: 'soegning' } });
  check(soeg, { 'søgning 200': (r) => r.status === 200 });

  sleep(1); // "tænketid" som en rigtig bruger
}

export function handleSummary(data) {
  const m = data.metrics;
  const resultat = {
    brugere: VUS,
    requests: m.http_reqs.values.count,
    gns_ms: m.http_req_duration.values.avg,
    p95_ms: m.http_req_duration.values['p(95)'],
    max_ms: m.http_req_duration.values.max,
    fejl_pct: m.http_req_failed.values.rate * 100,
  };
  return { [`${OUT}/resultat-${VUS}.json`]: JSON.stringify(resultat, null, 2) };
}
