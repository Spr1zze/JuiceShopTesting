// Fælles hjælpefunktioner til integrationstestene.
// Testene kører som black-box mod en kørende Juice Shop (default http://localhost:3000).
const request = require('supertest')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const api = () => request(BASE_URL)

// Unik e-mail pr. test, så testene kan køres igen uden at kollidere med tidligere data i databasen.
const uniqueEmail = (prefix = 'it') =>
  `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@test.dk`

const PASSWORD = 'Test12345!'

// POST /api/Users  (API -> Users-tabellen i SQLite)
async function registerUser (email = uniqueEmail(), password = PASSWORD) {
  return await api().post('/api/Users').send({
    email,
    password,
    passwordRepeat: password,
    securityQuestion: { id: 1 },
    securityAnswer: 'test'
  })
}

// POST /rest/user/login  (API -> slår brugeren op i databasen og udsteder JWT)
async function login (email, password = PASSWORD) {
  return await api().post('/rest/user/login').send({ email, password })
}

// Opretter en bruger, logger ind og returnerer token, basket-id og e-mail.
async function createLoggedInUser () {
  const email = uniqueEmail()
  const reg = await registerUser(email)
  if (reg.status !== 201) throw new Error(`Registrering fejlede: ${reg.status} ${JSON.stringify(reg.body)}`)
  const res = await login(email)
  if (res.status !== 200) throw new Error(`Login fejlede: ${res.status}`)
  const { token, bid } = res.body.authentication
  return { email, token, bid, userId: reg.body.data.id, auth: { Authorization: `Bearer ${token}` } }
}

module.exports = { api, BASE_URL, PASSWORD, uniqueEmail, registerUser, login, createLoggedInUser }
