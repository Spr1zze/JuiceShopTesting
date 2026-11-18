// INTEGRATIONSTEST 2 – Indkøbskurv (login + API + database)
// Komponenter i samspil: JWT-login -> POST /api/BasketItems (lagercheck mod Products)
//                        -> BasketItems-tabel -> GET /rest/basket/:id (join Baskets + BasketItems + Products)
const { api, createLoggedInUser } = require('./helpers')

describe('IT-2: Indkøbskurv (autentificering + API + database)', () => {
  let user

  beforeAll(async () => { user = await createLoggedInUser() })

  const addItem = async (ProductId, quantity) =>
    await api().post('/api/BasketItems').set(user.auth).send({ ProductId, BasketId: String(user.bid), quantity })

  const readBasket = async () => await api().get(`/rest/basket/${user.bid}`).set(user.auth)

  test('GYLDIGT: vare lægges i kurven og aflæses igen med korrekt navn, antal og total', async () => {
    const add = await addItem(1, 2)
    expect(add.status).toBe(200)

    const basket = await readBasket()
    expect(basket.status).toBe(200)
    const line = basket.body.data.Products.find(p => p.id === 1)
    expect(line.name).toBe('Apple Juice (1000ml)') // data fra Products-tabellen
    expect(line.BasketItem.quantity).toBe(2) // data fra BasketItems-tabellen
    const total = basket.body.data.Products.reduce((s, p) => s + p.price * p.BasketItem.quantity, 0)
    expect(total).toBeCloseTo(1.99 * 2, 2)
  })

  test('UGYLDIGT: antal over produktets grænse afvises med 400 og intet gemmes i kurven', async () => {
    const res = await addItem(5, 99999)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/only up to \d+ items/)

    const basket = await readBasket()
    expect(basket.body.data.Products.find(p => p.id === 5)).toBeUndefined() // databasen er uændret
  })
})
