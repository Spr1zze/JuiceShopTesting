// INTEGRATIONSTEST 2 – Produktsøgning (API + database)
// Komponenter i samspil: GET /rest/products/search?q=... -> SQL LIKE-forespørgsel i Products-tabellen -> JSON
const { api } = require('./helpers')

const search = async (q) => await api().get('/rest/products/search').query({ q })

describe('IT-2: Produktsøgning (API + database)', () => {
  test('søgning på "apple" returnerer kun produkter, hvor navn eller beskrivelse indeholder "apple"', async () => {
    const res = await search('apple')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.data.length).toBeGreaterThan(0)
    for (const p of res.body.data) {
      expect(`${p.name} ${p.description}`.toLowerCase()).toContain('apple')
    }
    expect(res.body.data.map(p => p.name)).toContain('Apple Juice (1000ml)')
  })

  test('produkter har det forventede format (id, navn, pris > 0) og er sorteret efter navn', async () => {
    const res = await search('juice')
    const names = res.body.data.map(p => p.name)

    expect(res.status).toBe(200)
    for (const p of res.body.data) {
      expect(p).toEqual(expect.objectContaining({ id: expect.any(Number), name: expect.any(String), price: expect.any(Number) }))
      expect(p.price).toBeGreaterThan(0)
    }
    expect(names).toEqual([...names].sort()) // SQLite ORDER BY name (binær sortering)
  })

  test('søgning er ikke case-sensitiv (APPLE giver samme resultat som apple)', async () => {
    const lille = await search('apple')
    const store = await search('APPLE')

    expect(store.body.data.map(p => p.id)).toEqual(lille.body.data.map(p => p.id))
  })

  test('UGYLDIGT: søgning uden match returnerer 200 og en tom liste (ikke en fejl)', async () => {
    const res = await search('zzzzqqqq-findes-ikke')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  test('GRÆNSE: tom søgning returnerer hele kataloget', async () => {
    const tom = await search('')
    const apple = await search('apple')

    expect(tom.status).toBe(200)
    expect(tom.body.data.length).toBeGreaterThan(apple.body.data.length)
  })

  test('UGYLDIGT: specialtegn (apostrof, <script>) giver ikke serverfejl og ingen falske match', async () => {
    for (const q of ["'", '<script>alert(1)</script>']) {
      const res = await search(q)
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    }
  })

  test('GRÆNSE: "%" er et SQL LIKE-wildcard og matcher hele kataloget (observation, ikke en fejl)', async () => {
    const res = await search('%')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(10)
  })
})
