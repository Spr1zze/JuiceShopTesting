// INTEGRATIONSTEST 1 – Registrering og login (API + database)
// Komponenter i samspil: POST /api/Users -> Sequelize -> SQLite (Users)
//                        POST /rest/user/login -> SQL-opslag i Users -> JWT
const { api, PASSWORD, uniqueEmail, registerUser, login } = require('./helpers')

describe('IT-1: Registrering og login (API + database)', () => {
  const email = uniqueEmail('it1')

  test('gyldig registrering gemmes i databasen og returnerer 201 uden klartekst-password', async () => {
    const res = await registerUser(email)

    expect(res.status).toBe(201)
    expect(res.body.status).toBe('success')
    expect(res.body.data.email).toBe(email)
    expect(res.body.data.id).toEqual(expect.any(Number)) // id kommer fra databasen
    expect(res.body.data.role).toBe('customer') // default-rolle sat af modellen
    expect(JSON.stringify(res.body)).not.toContain(PASSWORD) // password må ikke returneres i klartekst
  })

  test('den oprettede bruger kan logge ind og får et JWT-token + kurv-id (data læst tilbage fra databasen)', async () => {
    const res = await login(email)

    expect(res.status).toBe(200)
    const { token, bid, umail } = res.body.authentication
    expect(umail).toBe(email)
    expect(bid).toEqual(expect.any(Number)) // kurv oprettes ved første login
    expect(token.split('.')).toHaveLength(3) // JWT: header.payload.signature
  })

  test('UGYLDIGT: samme e-mail kan ikke registreres to gange (unik-constraint i databasen) -> 400', async () => {
    const res = await registerUser(email)

    expect(res.status).toBe(400)
    expect(res.body.errors[0]).toMatchObject({ field: 'email', message: 'email must be unique' })
  })

  test('UGYLDIGT: forkert password afvises med 401 og giver intet token', async () => {
    const res = await login(email, 'forkert-password')

    expect(res.status).toBe(401)
    expect(res.text).toMatch(/Invalid email or password/)
    expect(res.body.authentication).toBeUndefined()
  })

  test('UGYLDIGT: ukendt bruger og tom login-body afvises med 401', async () => {
    const ukendt = await login(uniqueEmail('findes-ikke'))
    const tom = await api().post('/rest/user/login').send({})

    expect(ukendt.status).toBe(401)
    expect(tom.status).toBe(401)
  })
})
