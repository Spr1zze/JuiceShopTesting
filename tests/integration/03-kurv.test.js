// INTEGRATIONSTEST 3 – Indkøbskurv (login + API + database)
// Komponenter i samspil: JWT-login -> POST /api/BasketItems (tjek af lagerstatus i Products/Quantities)
//                        -> BasketItems-tabel -> GET /rest/basket/:id (join Baskets + BasketItems + Products)
const { api, createLoggedInUser } = require('./helpers')

describe('IT-3: Indkøbskurv (autentificering + API + database)', () => {
  let user

  beforeAll(async () => { user = await createLoggedInUser() })

  const addItem = async (ProductId, quantity, BasketId = user.bid, headers = user.auth) =>
    await api().post('/api/BasketItems').set(headers).send({ ProductId, BasketId: String(BasketId), quantity })

  test('gyldig vare lægges i kurven og kan aflæses igen med korrekt antal og pris', async () => {
    const add = await addItem(1, 2)
    expect(add.status).toBe(200)
    expect(add.body.data).toMatchObject({ ProductId: 1, quantity: 2 })

    const basket = await api().get(`/rest/basket/${user.bid}`).set(user.auth)
    expect(basket.status).toBe(200)
    expect(basket.body.data.id).toBe(user.bid)
    expect(basket.body.data.UserId).toBe(user.userId)

    const line = basket.body.data.Products.find(p => p.id === 1)
    expect(line.name).toBe('Apple Juice (1000ml)') // data hentet fra Products-tabellen
    expect(line.BasketItem.quantity).toBe(2) // data hentet fra BasketItems-tabellen
    // kurv-total beregnet ud fra data fra begge tabeller
    const total = basket.body.data.Products.reduce((s, p) => s + p.price * p.BasketItem.quantity, 0)
    expect(total).toBeCloseTo(1.99 * 2, 2)
  })

  test('UGYLDIGT: antal over produktets grænse afvises med 400 og vises ikke i kurven', async () => {
    const res = await addItem(5, 99999)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/only up to \d+ items/)

    const basket = await api().get(`/rest/basket/${user.bid}`).set(user.auth)
    expect(basket.body.data.Products.find(p => p.id === 5)).toBeUndefined()
  })

  test('UGYLDIGT: man kan ikke lægge varer i en andens kurv (fremmed BasketId) -> 401', async () => {
    const res = await addItem(2, 1, 1) // kurv 1 tilhører admin
    expect(res.status).toBe(401)
    expect(res.text).toMatch(/Invalid BasketId/)
  })

  test('UGYLDIGT: uden login-token afvises både tilføjelse og aflæsning med 401', async () => {
    const add = await addItem(1, 1, user.bid, {})
    const read = await api().get(`/rest/basket/${user.bid}`)

    expect(add.status).toBe(401)
    expect(read.status).toBe(401)
  })

  test('UGYLDIGT: ikke-eksisterende produkt kan ikke lægges i kurven (fejlstatus, ingen vare gemt)', async () => {
    const res = await addItem(999999, 1)
    expect(res.status).toBeGreaterThanOrEqual(400) // observeret: 500 "No such product found!"

    const basket = await api().get(`/rest/basket/${user.bid}`).set(user.auth)
    expect(basket.body.data.Products.find(p => p.id === 999999)).toBeUndefined()
  })
})
