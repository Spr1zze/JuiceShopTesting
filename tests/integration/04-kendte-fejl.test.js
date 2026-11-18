// KENDTE FEJL – ugyldige data som Juice Shop FORKERT accepterer.
// Hver test beskriver den ØNSKEDE (korrekte) opførsel. Fordi fejlen findes i dag, bruges `test.failing`:
//   - testen tæller som BESTÅET så længe fejlen findes (fejlen er dokumenteret og fanget),
//   - testen bliver RØD når fejlen rettes -> så skal `.failing` fjernes, og testen er en almindelig regressionstest.
const { api, uniqueEmail, PASSWORD, createLoggedInUser } = require('./helpers')

const register = async (body) => await api().post('/api/Users').send(body)

describe('Kendte fejl: ugyldigt input som bør afvises (jf. testplan TC5-TC7)', () => {
  test.failing('FEJL-1 (middel): registrering med ugyldig e-mail bør afvises med 400', async () => {
    const res = await register({ email: `ikke-en-email-${Date.now()}`, password: PASSWORD, passwordRepeat: PASSWORD })
    expect(res.status).toBe(400)
  })

  test.failing('FEJL-2 (middel): registrering hvor passwordRepeat er forskellig bør afvises med 400', async () => {
    const res = await register({ email: uniqueEmail('mm'), password: PASSWORD, passwordRepeat: 'Noget-andet' })
    expect(res.status).toBe(400)
  })

  test.failing('FEJL-3 (høj): registrering uden password bør afvises med 400', async () => {
    const res = await register({ email: uniqueEmail('np') })
    expect(res.status).toBe(400)
  })

  test.failing('FEJL-4 (middel): negativt antal i kurven (-1) bør afvises med 400', async () => {
    const user = await createLoggedInUser()
    const res = await api().post('/api/BasketItems').set(user.auth)
      .send({ ProductId: 3, BasketId: String(user.bid), quantity: -1 })
    expect(res.status).toBe(400)
  })

  test.failing('FEJL-5 (middel): antal 0 i kurven bør afvises med 400', async () => {
    const user = await createLoggedInUser()
    const res = await api().post('/api/BasketItems').set(user.auth)
      .send({ ProductId: 4, BasketId: String(user.bid), quantity: 0 })
    expect(res.status).toBe(400)
  })

  test.failing('FEJL-6 (høj): en bruger bør ikke kunne læse en andens kurv (/rest/basket/1) -> 401/403', async () => {
    const user = await createLoggedInUser()
    const res = await api().get('/rest/basket/1').set(user.auth) // kurv 1 tilhører admin
    expect([401, 403]).toContain(res.status)
  })
})
