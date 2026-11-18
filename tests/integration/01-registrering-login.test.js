// INTEGRATIONSTEST 1 – Registrering og login (API + database)
// Komponenter i samspil: POST /api/Users -> Sequelize -> SQLite (Users)
//                        POST /rest/user/login -> SQL-opslag i Users -> JWT
const { uniqueEmail, registerUser, login } = require('./helpers')

describe('IT-1: Registrering og login (API + database)', () => {
  const email = uniqueEmail('it1')

  test('GYLDIGT: bruger registreres og kan derefter logge ind med token (data skrevet til og læst fra databasen)', async () => {
    const reg = await registerUser(email)
    expect(reg.status).toBe(201)
    expect(reg.body.data.email).toBe(email)
    expect(reg.body.data.id).toEqual(expect.any(Number)) // id kommer fra databasen

    const res = await login(email)
    expect(res.status).toBe(200)
    expect(res.body.authentication.umail).toBe(email)
    expect(res.body.authentication.token.split('.')).toHaveLength(3) // JWT: header.payload.signature
  })

  test('UGYLDIGT: forkert password afvises med 401 og giver intet token', async () => {
    const res = await login(email, 'forkert-password')
    expect(res.status).toBe(401)
    expect(res.text).toMatch(/Invalid email or password/)
    expect(res.body.authentication).toBeUndefined()
  })
})
